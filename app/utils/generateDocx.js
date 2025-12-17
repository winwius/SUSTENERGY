/**
 * Energy Audit Form - Document Generator
 * Generates a DOCX file with audit details, observations, and snapshots
 * Based on simplified reference methodology
 */

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    ImageRun,
    WidthType,
    BorderStyle,
    AlignmentType,
    Header,
    Footer,
    PageNumber,
    BookmarkStart,
    BookmarkEnd,
    SimpleField,
    TableLayoutType
} from "docx";

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

/**
 * Convert image URL/DataURL to Uint8Array for DOCX embedding
 */
async function convertImageToBytes(url) {
    if (!url) return null;
    try {
        if (url.startsWith('data:')) {
            const base64Data = url.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }

        // Handle external URLs
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error('Error converting image:', error);
        return null;
    }
}

/**
 * Create a table row with label and value (fixed DXA widths for Google Docs compatibility)
 */
function createTableRow(label, value) {
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
                    size: 2800,
                    type: WidthType.DXA
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
                                text: value || "-",
                                size: 24,
                                color: "1F2937"
                            })
                        ]
                    })
                ],
                width: {
                    size: 6560,
                    type: WidthType.DXA
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
 * Create a data table row (for power parameters, load details)
 */
function createDataRow(cells, isHeader = false) {
    return new TableRow({
        children: cells.map((text, index) =>
            new TableCell({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: text !== null && text !== undefined ? String(text) : "-",
                                bold: isHeader,
                                size: 22,
                                color: isHeader ? "1F2937" : "4B5563"
                            })
                        ],
                        alignment: index === 0 ? AlignmentType.LEFT : AlignmentType.CENTER
                    })
                ],
                shading: isHeader ? { fill: "E5E7EB" } : undefined,
                margins: {
                    top: 80,
                    bottom: 80,
                    left: 100,
                    right: 100
                }
            })
        )
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
 * Main document generation function
 */
export const generateDocx = async (data) => {
    const {
        branchName,
        branchCode,
        refNo,
        date,
        inspectionDate,
        client,
        generalObservations,
        majorHighlights,
        snapshots,
        powerParameters,
        connectedLoad,
        conclusions,
        logo,
        signature
    } = data;

    // Prepare document children
    const documentChildren = [];

    // ========== TITLE ==========
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "ELECTRICAL SAFETY AUDIT REPORT",
                    bold: true,
                    size: 48,
                    color: "2563EB"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        })
    );

    // Branch info
    if (branchName) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `BRANCH: ${branchName}`,
                        bold: true,
                        size: 28,
                        color: "374151"
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
            })
        );
    }

    if (branchCode) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `BRANCH CODE: ${branchCode}`,
                        size: 24,
                        color: "6B7280"
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );
    }

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

    // ========== GENERAL INFORMATION TABLE ==========
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

    const infoRows = [];
    if (refNo) infoRows.push(createTableRow("Reference No", refNo));
    if (date) infoRows.push(createTableRow("Report Date", formatDate(date)));
    if (inspectionDate) infoRows.push(createTableRow("Inspection Date", formatDate(inspectionDate)));
    if (client) infoRows.push(createTableRow("Client", client));

    if (infoRows.length > 0) {
        documentChildren.push(
            new Table({
                layout: TableLayoutType.FIXED,
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2800, 6560],
                rows: infoRows
            })
        );
    }

    // ========== TABLE OF CONTENTS ==========
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "Table of Contents",
                    bold: true,
                    size: 36,
                    color: "1F2937"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 300 }
        })
    );

    // TOC Table with teal header
    const tocItems = [
        { sl: "1", desc: "Audit - General observations", bookmark: "section_observations" },
        { sl: "2", desc: "Major Highlights", bookmark: "section_highlights" },
        { sl: "3", desc: "Snapshots of electrical installation", bookmark: "section_snapshots" },
        { sl: "4", desc: "Power parameters", bookmark: "section_power" },
        { sl: "5", desc: "Connected load detail", bookmark: "section_load" },
        { sl: "6", desc: "Conclusions", bookmark: "section_conclusions" }
    ];

    // Create TOC header row with teal background (fixed DXA widths for Google Docs)
    const tocHeaderRow = new TableRow({
        children: [
            new TableCell({
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "Sl. No", bold: true, size: 24, color: "FFFFFF" })],
                        alignment: AlignmentType.CENTER
                    })
                ],
                shading: { fill: "2DD4BF" },
                width: { size: 1400, type: WidthType.DXA },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "Description", bold: true, size: 24, color: "FFFFFF" })]
                    })
                ],
                shading: { fill: "2DD4BF" },
                width: { size: 6100, type: WidthType.DXA },
                margins: { top: 100, bottom: 100, left: 150, right: 100 }
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "Page No", bold: true, size: 24, color: "FFFFFF" })],
                        alignment: AlignmentType.CENTER
                    })
                ],
                shading: { fill: "2DD4BF" },
                width: { size: 1860, type: WidthType.DXA },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
            })
        ]
    });

    // Create TOC data rows
    const tocDataRows = tocItems.map(item =>
        new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: item.sl, size: 24, color: "374151" })],
                            alignment: AlignmentType.CENTER
                        })
                    ],
                    width: { size: 1400, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    borders: {
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" }
                    }
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: item.desc, size: 24, color: "374151" })]
                        })
                    ],
                    width: { size: 6100, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 150, right: 100 },
                    borders: {
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" }
                    }
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new SimpleField(`PAGEREF ${item.bookmark}`)],
                            alignment: AlignmentType.CENTER
                        })
                    ],
                    width: { size: 1860, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    borders: {
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" }
                    }
                })
            ]
        })
    );

    documentChildren.push(
        new Table({
            layout: TableLayoutType.FIXED,
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [1400, 6100, 1860],
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
            },
            rows: [tocHeaderRow, ...tocDataRows]
        })
    );

    // ========== GENERAL OBSERVATIONS ==========
    if (generalObservations) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new BookmarkStart("section_observations"),
                    new TextRun({
                        text: "1.0 Audit - General Observations",
                        bold: true,
                        size: 32,
                        color: "10B981"
                    }),
                    new BookmarkEnd("section_observations")
                ],
                spacing: { before: 400, after: 200 }
            })
        );

        documentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: generalObservations,
                        size: 24,
                        color: "374151"
                    })
                ],
                spacing: { after: 200 }
            })
        );
    }

    // ========== MAJOR HIGHLIGHTS ==========
    if (majorHighlights && majorHighlights.length > 0 && majorHighlights.some(h => h.trim() !== "")) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new BookmarkStart("section_highlights"),
                    new TextRun({
                        text: "2.0 Major Highlights",
                        bold: true,
                        size: 32,
                        color: "F59E0B"
                    }),
                    new BookmarkEnd("section_highlights")
                ],
                spacing: { before: 400, after: 200 }
            })
        );

        majorHighlights.forEach(highlight => {
            if (highlight.trim() !== "") {
                documentChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `• ${highlight}`,
                                size: 24,
                                color: "374151"
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );
            }
        });
    }
    // ========== SNAPSHOTS ==========
    if (snapshots && snapshots.length > 0) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new BookmarkStart("section_snapshots"),
                    new TextRun({
                        text: "3.0 Snapshots of Electrical Installation",
                        bold: true,
                        size: 32,
                        color: "8B5CF6"
                    }),
                    new BookmarkEnd("section_snapshots")
                ],
                spacing: { before: 400, after: 200 }
            })
        );

        // Create snapshot table header row with teal background (fixed DXA widths)
        const snapshotHeaderRow = new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Sl. No", bold: true, size: 24, color: "FFFFFF" })],
                            alignment: AlignmentType.CENTER
                        })
                    ],
                    shading: { fill: "2DD4BF" },
                    width: { size: 936, type: WidthType.DXA },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Image", bold: true, size: 24, color: "FFFFFF" })]
                        })
                    ],
                    shading: { fill: "2DD4BF" },
                    width: { size: 3744, type: WidthType.DXA },
                    margins: { top: 100, bottom: 100, left: 150, right: 100 }
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Description", bold: true, size: 24, color: "FFFFFF" })]
                        })
                    ],
                    shading: { fill: "2DD4BF" },
                    width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 100, bottom: 100, left: 150, right: 100 }
                })
            ]
        });

        // Create snapshot data rows
        const snapshotDataRows = [];
        let slNo = 1;

        for (const group of snapshots) {
            // Get images for this group
            const groupImages = group.images || [];
            const description = group.description || "";

            if (groupImages.length === 0) {
                // No images, just description
                snapshotDataRows.push(
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: slNo.toString(), size: 24, color: "374151" })],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: "No Image", size: 22, color: "9CA3AF", italics: true })]
                                    })
                                ],
                                margins: { top: 100, bottom: 100, left: 150, right: 100 },
                                borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: description, size: 22, color: "374151" })]
                                    })
                                ],
                                margins: { top: 100, bottom: 100, left: 150, right: 100 },
                                borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }
                            })
                        ]
                    })
                );
                slNo++;
            } else {
                // Process each image in the group
                for (let i = 0; i < groupImages.length; i++) {
                    const imgUrl = groupImages[i];
                    let imageContent = new Paragraph({
                        children: [new TextRun({ text: "Error loading image", size: 20, color: "EF4444", italics: true })]
                    });

                    try {
                        const imgBytes = await convertImageToBytes(imgUrl);
                        if (imgBytes) {
                            imageContent = new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: imgBytes,
                                        transformation: {
                                            width: 200,
                                            height: 150
                                        },
                                        type: 'png'
                                    })
                                ]
                            });
                        }
                    } catch (error) {
                        console.error('Error processing snapshot image:', error);
                    }

                    // First image gets the Sl. No and description, subsequent images get empty cells
                    const isFirst = i === 0;

                    snapshotDataRows.push(
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: isFirst ? slNo.toString() : "", size: 24, color: "374151" })],
                                            alignment: AlignmentType.CENTER
                                        })
                                    ],
                                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                    borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }
                                }),
                                new TableCell({
                                    children: [imageContent],
                                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                    borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: isFirst ? description : "", size: 22, color: "374151" })]
                                        })
                                    ],
                                    margins: { top: 100, bottom: 100, left: 150, right: 100 },
                                    borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }
                                })
                            ]
                        })
                    );
                }
                slNo++;
            }
        }

        // Add the snapshots table
        documentChildren.push(
            new Table({
                layout: TableLayoutType.FIXED,
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [936, 3744, 4680],
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE }
                },
                rows: [snapshotHeaderRow, ...snapshotDataRows]
            })
        );
    }

    // ========== POWER PARAMETERS ==========
    if (powerParameters) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new BookmarkStart("section_power"),
                    new TextRun({
                        text: "4.0 Power Parameters",
                        bold: true,
                        size: 32,
                        color: "F59E0B"
                    }),
                    new BookmarkEnd("section_power")
                ],
                spacing: { before: 400, after: 200 }
            })
        );

        const pp = powerParameters;
        const powerRows = [
            createDataRow(["Parameter", "Test Point", "Value", "Remarks"], true),
            createDataRow(["Line Voltage", "RY", pp.lineVoltage?.ry || "", ""]),
            createDataRow(["", "YB", pp.lineVoltage?.yb || "", ""]),
            createDataRow(["", "BR", pp.lineVoltage?.br || "", ""]),
            createDataRow(["Phase Voltage", "R-N", pp.phaseVoltage?.rn || "", ""]),
            createDataRow(["", "Y-N", pp.phaseVoltage?.yn || "", ""]),
            createDataRow(["", "B-N", pp.phaseVoltage?.bn || "", ""]),
            createDataRow(["Neutral to Earth", "N-E", pp.neutralEarth?.ne || "", ""]),
            createDataRow(["Current", "R", pp.current?.r || "", ""]),
            createDataRow(["", "Y", pp.current?.y || "", ""]),
            createDataRow(["", "B", pp.current?.b || "", ""]),
            createDataRow(["", "N", pp.current?.n || "", ""]),
            createDataRow(["Frequency", "", pp.frequency || "", ""]),
            createDataRow(["Power Factor", "", pp.powerFactor || "", ""])
        ];

        documentChildren.push(
            new Table({
                layout: TableLayoutType.FIXED,
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2340, 2340, 2340, 2340],
                rows: powerRows
            })
        );
    }

    // ========== CONNECTED LOAD ==========
    if (connectedLoad && connectedLoad.length > 0) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new BookmarkStart("section_load"),
                    new TextRun({
                        text: "5.0 Connected Load Detail",
                        bold: true,
                        size: 32,
                        color: "EF4444"
                    }),
                    new BookmarkEnd("section_load")
                ],
                spacing: { before: 400, after: 200 }
            })
        );

        const loadRows = [
            createDataRow(["Sl. No", "Type of Load", "Power (W)", "Qty", "Sub Total (KW)"], true),
            ...connectedLoad.map((load, index) =>
                createDataRow([index + 1, load.type, load.power, load.qty, load.subTotal])
            )
        ];

        // Calculate total
        const totalLoad = connectedLoad.reduce((acc, curr) => acc + (parseFloat(curr.subTotal) || 0), 0);
        loadRows.push(createDataRow(["", "Connected load in KW", "", "", totalLoad.toFixed(2)], true));

        documentChildren.push(
            new Table({
                layout: TableLayoutType.FIXED,
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [936, 3276, 1872, 936, 2340],
                rows: loadRows
            })
        );
    }

    // ========== CONCLUSIONS ==========
    if (conclusions && conclusions.length > 0) {
        documentChildren.push(
            new Paragraph({
                children: [
                    new BookmarkStart("section_conclusions"),
                    new TextRun({
                        text: "6.0 Conclusions",
                        bold: true,
                        size: 32,
                        color: "6366F1"
                    }),
                    new BookmarkEnd("section_conclusions")
                ],
                spacing: { before: 400, after: 200 }
            })
        );

        conclusions.forEach(conclusion => {
            documentChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `• ${conclusion}`,
                            size: 24,
                            color: "374151"
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
        });
    }

    // ========== SIGNATORY SECTION ==========
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "For Sustenergy Foundation",
                    bold: true,
                    size: 24,
                    color: "1F2937"
                })
            ],
            spacing: { before: 600, after: 200 }
        })
    );

    // Add signature image
    if (signature) {
        try {
            const sigBytes = await convertImageToBytes(signature);
            if (sigBytes) {
                documentChildren.push(
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: sigBytes,
                                transformation: {
                                    width: 150,
                                    height: 75
                                },
                                type: 'png'
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );
            }
        } catch (error) {
            console.error('Error processing signature:', error);
        }
    }

    // Signatory details
    documentChildren.push(
        new Paragraph({
            children: [new TextRun({ text: "Jayakumar.R", bold: true, size: 24 })],
            spacing: { after: 50 }
        }),
        new Paragraph({
            children: [new TextRun({ text: "Principal Consultant.", size: 22, color: "4B5563" })],
            spacing: { after: 50 }
        }),
        new Paragraph({
            children: [new TextRun({ text: "Certified Energy Manager – EM 0514 – Bureau of Energy efficiency, India", size: 20, color: "6B7280" })],
            spacing: { after: 50 }
        }),
        new Paragraph({
            children: [new TextRun({ text: "Supervisor Grade A – SA 1387- All LT/MV/HT Electrical Installation, KSELB, Kerala State", size: 20, color: "6B7280" })],
            spacing: { after: 50 }
        }),
        new Paragraph({
            children: [new TextRun({ text: "Certified Infrared Thermographer Level 1 – No 2017IN08N002 - Infrared Training Center, Sweden", size: 20, color: "6B7280" })],
            spacing: { after: 200 }
        })
    );

    // ========== FOOTER AUTO-GENERATED NOTE ==========
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
            spacing: { before: 400 }
        })
    );

    // ========== LOAD HEADER LOGOS ==========
    // Load client logo for header (left side)
    let clientLogoBytes = null;
    if (logo) {
        try {
            clientLogoBytes = await convertImageToBytes(logo);
        } catch (error) {
            console.error('Error loading client logo for header:', error);
        }
    }

    // Load Sustenergy logo for header (right side)
    let sustLogoBytes = null;
    try {
        const sustLogoUrl = window.location.origin + "/sustenergy_logo.png";
        sustLogoBytes = await convertImageToBytes(sustLogoUrl);
    } catch (error) {
        console.error('Error loading Sustenergy logo:', error);
    }

    // Create header with both logos in a table (client left, Sustenergy right)
    const headerChildren = [];

    // Build left logo cell content
    let leftLogoContent = new Paragraph({ text: "" });
    if (clientLogoBytes) {
        leftLogoContent = new Paragraph({
            children: [
                new ImageRun({
                    data: clientLogoBytes,
                    transformation: {
                        width: 100,
                        height: 60
                    },
                    type: 'png'
                })
            ],
            alignment: AlignmentType.LEFT
        });
    }

    // Build right logo cell content
    let rightLogoContent = new Paragraph({ text: "" });
    if (sustLogoBytes) {
        rightLogoContent = new Paragraph({
            children: [
                new ImageRun({
                    data: sustLogoBytes,
                    transformation: {
                        width: 100,
                        height: 60
                    },
                    type: 'png'
                })
            ],
            alignment: AlignmentType.RIGHT
        });
    }

    // Create header table with logos (fixed DXA widths for Google Docs)
    const headerTable = new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [leftLogoContent],
                        width: { size: 4680, type: WidthType.DXA },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE }
                        }
                    }),
                    new TableCell({
                        children: [rightLogoContent],
                        width: { size: 4680, type: WidthType.DXA },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE }
                        }
                    })
                ]
            })
        ]
    });

    headerChildren.push(headerTable);

    // Create footer with page numbers
    const footerChildren = [
        new Paragraph({
            children: [
                new TextRun({
                    text: "Electrical Safety Audit Report",
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

    // ========== CREATE DOCUMENT ==========
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
    try {
        const blob = await Packer.toBlob(doc);
        const safeBranchName = (branchName || "Draft").replace(/[^a-z0-9\s-_]/gi, '').trim().replace(/\s+/g, '_');
        const fileName = `Audit_Report_${safeBranchName}.docx`;

        console.log("Saving file:", fileName);
        downloadFile(blob, fileName);
        console.log("File saved successfully");
    } catch (error) {
        console.error("Error generating document:", error);
        alert("Error generating document. Please check console for details.");
    }
};
