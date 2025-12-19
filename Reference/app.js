/**
 * Energy Audit Form - Document Generator
 * Generates a DOCX file with audit details, observations, and snapshots
 */

/**
 * Custom download function for reliable file downloads
 */
function downloadFile(blob, fileName) {
    const docxBlob = new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const url = window.URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();

    window.setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 250);
}

// DOM Elements
const form = document.getElementById('applicationForm');
const submitBtn = document.getElementById('submitBtn');
const successModal = document.getElementById('successModal');
const closeModal = document.getElementById('closeModal');
const addSnapshotBtn = document.getElementById('addSnapshotBtn');
const snapshotsContainer = document.getElementById('snapshotsContainer');
const emptySnapshotsState = document.getElementById('emptySnapshotsState');
const snapshotTemplate = document.getElementById('snapshotTemplate');

// File inputs
const clientLogoInput = document.getElementById('clientLogo');
const logoPreview = document.getElementById('logoPreview');

// Store data
let clientLogoData = null;
let snapshots = [];
let snapshotCounter = 0;

/**
 * Handle client logo upload
 */
clientLogoInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            clientLogoData = e.target.result;
            logoPreview.innerHTML = `<img src="${clientLogoData}" alt="Client Logo">`;
        };
        reader.readAsDataURL(file);
    }
});

/**
 * Add new snapshot
 */
addSnapshotBtn.addEventListener('click', function () {
    snapshotCounter++;

    // Hide empty state
    emptySnapshotsState.style.display = 'none';

    // Clone template
    const template = snapshotTemplate.content.cloneNode(true);
    const snapshotItem = template.querySelector('.snapshot-item');
    const snapshotNumber = template.querySelector('.snapshot-number');
    const removeBtn = template.querySelector('.remove-snapshot-btn');
    const fileInput = template.querySelector('.snapshot-file-input');
    const preview = template.querySelector('.snapshot-preview');
    const description = template.querySelector('.snapshot-description');

    // Set unique ID
    const snapshotId = `snapshot_${snapshotCounter}`;
    snapshotItem.dataset.id = snapshotId;
    snapshotNumber.textContent = `Observation #${snapshotCounter}`;

    // Add to snapshots array
    snapshots.push({
        id: snapshotId,
        imageData: null,
        description: ''
    });

    // Handle image upload
    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imageData = e.target.result;
                preview.innerHTML = `<img src="${imageData}" alt="Snapshot">`;
                preview.classList.add('has-image');

                // Update snapshot data
                const snapshot = snapshots.find(s => s.id === snapshotId);
                if (snapshot) {
                    snapshot.imageData = imageData;
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle description change
    description.addEventListener('input', function () {
        const snapshot = snapshots.find(s => s.id === snapshotId);
        if (snapshot) {
            snapshot.description = this.value;
        }
    });

    // Handle remove
    removeBtn.addEventListener('click', function () {
        snapshotItem.remove();
        snapshots = snapshots.filter(s => s.id !== snapshotId);

        // Show empty state if no snapshots
        if (snapshots.length === 0) {
            emptySnapshotsState.style.display = 'block';
        }

        // Renumber remaining snapshots
        renumberSnapshots();
    });

    // Insert before add button
    snapshotsContainer.insertBefore(template, addSnapshotBtn.parentElement ? null : addSnapshotBtn);
    snapshotsContainer.insertBefore(snapshotItem, addSnapshotBtn);
});

/**
 * Renumber snapshots after removal
 */
function renumberSnapshots() {
    const items = snapshotsContainer.querySelectorAll('.snapshot-item');
    items.forEach((item, index) => {
        const numberEl = item.querySelector('.snapshot-number');
        numberEl.textContent = `Observation #${index + 1}`;
    });
}

/**
 * Handle form submission
 */
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Gather form data
    const formData = {
        clientLogo: clientLogoData,
        branchName: document.getElementById('branchName').value.trim(),
        branchCode: document.getElementById('branchCode').value.trim(),
        referenceNo: document.getElementById('referenceNo').value.trim(),
        reportDate: document.getElementById('reportDate').value,
        inspectionDate: document.getElementById('inspectionDate').value,
        clientName: document.getElementById('clientName').value.trim(),
        generalObservations: document.getElementById('generalObservations').value.trim(),
        snapshots: snapshots.filter(s => s.imageData || s.description)
    };

    // Validation
    if (!formData.clientName) {
        alert('Please enter the Client Name.');
        return;
    }

    // Show loading state
    setLoadingState(true);

    try {
        await generateDocument(formData);
        showSuccessModal();
    } catch (error) {
        console.error('Error generating document:', error);
        alert('An error occurred while generating the document. Please try again.');
    } finally {
        setLoadingState(false);
    }
});

/**
 * Set button loading state
 */
function setLoadingState(isLoading) {
    const btnText = submitBtn.querySelector('.btn-text');
    const btnIcon = submitBtn.querySelector('.btn-icon');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    if (isLoading) {
        submitBtn.disabled = true;
        btnText.style.opacity = '0';
        btnIcon.style.opacity = '0';
        btnLoader.style.display = 'flex';
    } else {
        submitBtn.disabled = false;
        btnText.style.opacity = '1';
        btnIcon.style.opacity = '1';
        btnLoader.style.display = 'none';
    }
}

/**
 * Generate DOCX document
 */
async function generateDocument(formData) {
    const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } = docx;

    // Prepare document children
    const documentChildren = [];

    // Title
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "ENERGY AUDIT REPORT",
                    bold: true,
                    size: 48,
                    color: "2563EB"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    // Horizontal line
    documentChildren.push(
        new Paragraph({
            border: {
                bottom: {
                    color: "CCCCCC",
                    space: 1,
                    size: 6,
                    style: BorderStyle.SINGLE
                }
            },
            spacing: { after: 400 }
        })
    );

    // Add client logo if available
    if (formData.clientLogo) {
        try {
            const base64Data = formData.clientLogo.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            documentChildren.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: bytes,
                            transformation: {
                                width: 150,
                                height: 80
                            },
                            type: 'png'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                })
            );
        } catch (error) {
            console.error('Error processing logo:', error);
        }
    }

    // General Information Section Header
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "General Information",
                    bold: true,
                    size: 32,
                    color: "4285F4"
                })
            ],
            spacing: { before: 200, after: 200 }
        })
    );

    // Create table for general information
    const infoRows = [];

    if (formData.branchName) {
        infoRows.push(createTableRow("Branch Name", formData.branchName));
    }
    if (formData.branchCode) {
        infoRows.push(createTableRow("Branch Code", formData.branchCode));
    }
    if (formData.referenceNo) {
        infoRows.push(createTableRow("Reference No", formData.referenceNo));
    }
    if (formData.reportDate) {
        infoRows.push(createTableRow("Report Date", formatDate(formData.reportDate)));
    }
    if (formData.inspectionDate) {
        infoRows.push(createTableRow("Inspection Date", formatDate(formData.inspectionDate)));
    }
    if (formData.clientName) {
        infoRows.push(createTableRow("Client Name", formData.clientName));
    }

    if (infoRows.length > 0) {
        documentChildren.push(
            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE
                },
                rows: infoRows
            })
        );
    }

    // General Observations Section
    if (formData.generalObservations) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "General Observations",
                        bold: true,
                        size: 32,
                        color: "10B981"
                    })
                ],
                spacing: { before: 400, after: 200 }
            })
        );

        documentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: formData.generalObservations,
                        size: 24,
                        color: "374151"
                    })
                ],
                spacing: { after: 200 }
            })
        );
    }

    // Snapshots Section
    if (formData.snapshots.length > 0) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Snapshots / Observations",
                        bold: true,
                        size: 32,
                        color: "8B5CF6"
                    })
                ],
                spacing: { before: 400, after: 200 }
            })
        );

        for (let i = 0; i < formData.snapshots.length; i++) {
            const snapshot = formData.snapshots[i];

            // Observation number
            documentChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Observation #${i + 1}`,
                            bold: true,
                            size: 26,
                            color: "6B7280"
                        })
                    ],
                    spacing: { before: 200, after: 100 }
                })
            );

            // Add snapshot image
            if (snapshot.imageData) {
                try {
                    const base64Data = snapshot.imageData.split(',')[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let j = 0; j < binaryString.length; j++) {
                        bytes[j] = binaryString.charCodeAt(j);
                    }

                    documentChildren.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: bytes,
                                    transformation: {
                                        width: 400,
                                        height: 300
                                    },
                                    type: 'png'
                                })
                            ],
                            spacing: { after: 100 }
                        })
                    );
                } catch (error) {
                    console.error('Error processing snapshot image:', error);
                }
            }

            // Add description
            if (snapshot.description) {
                documentChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: snapshot.description,
                                size: 22,
                                color: "4B5563"
                            })
                        ],
                        spacing: { after: 200 }
                    })
                );
            }
        }
    }

    // Footer
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "This document was generated automatically.",
                    italics: true,
                    size: 20,
                    color: "9CA3AF"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 }
        })
    );

    // Create document with header and footer
    const { Header, Footer, PageNumber, NumberFormat } = docx;

    // Load header logo from file
    let headerLogoBytes = null;
    try {
        const logoResponse = await fetch('header_logo.txt');
        const logoBase64 = await logoResponse.text();
        const binaryString = atob(logoBase64.trim());
        headerLogoBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            headerLogoBytes[i] = binaryString.charCodeAt(i);
        }
    } catch (error) {
        console.error('Error loading header logo:', error);
    }

    // Create header with logo
    const headerChildren = [];
    if (headerLogoBytes) {
        headerChildren.push(
            new Paragraph({
                children: [
                    new ImageRun({
                        data: headerLogoBytes,
                        transformation: {
                            width: 120,
                            height: 80
                        },
                        type: 'jpg'
                    })
                ],
                alignment: AlignmentType.CENTER
            })
        );
    }

    // Create footer with "Sample Generation" and page numbers
    const footerChildren = [
        new Paragraph({
            children: [
                new TextRun({
                    text: "Sample Generation",
                    size: 20,
                    color: "666666"
                }),
                new TextRun({
                    text: "    |    Page ",
                    size: 20,
                    color: "666666"
                }),
                new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 20,
                    color: "666666"
                }),
                new TextRun({
                    text: " of ",
                    size: 20,
                    color: "666666"
                }),
                new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 20,
                    color: "666666"
                })
            ],
            alignment: AlignmentType.CENTER
        })
    ];

    const doc = new Document({
        sections: [{
            properties: {},
            headers: {
                default: new Header({
                    children: headerChildren
                })
            },
            footers: {
                default: new Footer({
                    children: footerChildren
                })
            },
            children: documentChildren
        }]
    });

    // Generate and save file
    const blob = await Packer.toBlob(doc);
    const fileName = `EnergyAudit_${formData.clientName.replace(/\s+/g, '_')}_${formData.referenceNo || 'Report'}.docx`;

    downloadFile(blob, fileName);
}

/**
 * Create a table row with label and value
 */
function createTableRow(label, value) {
    const { TableRow, TableCell, Paragraph, TextRun, WidthType } = docx;

    return new TableRow({
        children: [
            new TableCell({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: label,
                                bold: true,
                                size: 24,
                                color: "4B5563"
                            })
                        ]
                    })
                ],
                width: {
                    size: 30,
                    type: WidthType.PERCENTAGE
                },
                shading: {
                    fill: "F3F4F6"
                },
                margins: {
                    top: 100,
                    bottom: 100,
                    left: 150,
                    right: 150
                }
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: value,
                                size: 24,
                                color: "1F2937"
                            })
                        ]
                    })
                ],
                width: {
                    size: 70,
                    type: WidthType.PERCENTAGE
                },
                margins: {
                    top: 100,
                    bottom: 100,
                    left: 150,
                    right: 150
                }
            })
        ]
    });
}

/**
 * Format date string
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Show success modal
 */
function showSuccessModal() {
    successModal.classList.add('active');
}

/**
 * Close success modal and reset form
 */
closeModal.addEventListener('click', function () {
    successModal.classList.remove('active');
    resetForm();
});

/**
 * Reset form to initial state
 */
function resetForm() {
    form.reset();
    clientLogoData = null;
    logoPreview.innerHTML = '<span class="placeholder-text">No file chosen</span>';

    // Clear snapshots
    snapshots = [];
    snapshotCounter = 0;
    const snapshotItems = snapshotsContainer.querySelectorAll('.snapshot-item');
    snapshotItems.forEach(item => item.remove());
    emptySnapshotsState.style.display = 'block';
}

// Close modal on backdrop click
successModal.addEventListener('click', function (e) {
    if (e.target === successModal) {
        successModal.classList.remove('active');
        resetForm();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && successModal.classList.contains('active')) {
        successModal.classList.remove('active');
        resetForm();
    }
});
