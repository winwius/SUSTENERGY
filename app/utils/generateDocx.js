
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, WidthType, BorderStyle, HeadingLevel, AlignmentType, Header, Footer, PageNumber, PageBreak, SimpleField, BookmarkStart, BookmarkEnd, ShadingType, TableLayoutType } from "docx";
import { saveAs } from "file-saver";

export const generateDocx = async (data) => {
    const {
        branchName,
        branchCode,
        refNo,
        date,
        inspectionDate,
        client,
        generalObservations,
        snapshots,
        powerParameters,
        connectedLoad,
        conclusions,
        logo,
        signature // Extract signature
    } = data;

    // Helper to create table cells
    const createCell = (text, bold = false) => {
        const safeText = text !== null && text !== undefined ? String(text) : "-";
        return new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: safeText, bold })] })],
            verticalAlign: "center",
        });
    };

    // Helper to securely fetch images
    const fetchImage = async (url) => {
        try {
            if (!url) return null;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

            let blob = await response.blob();

            // Basic validation
            if (blob.size === 0 || blob.type.indexOf('text/html') !== -1) return null;

            // Convert WebP or other unsupported types to PNG
            if (blob.type === 'image/webp' || blob.type === 'image/gif' || blob.type === 'image/avif') {
                try {
                    blob = await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            canvas.toBlob((newBlob) => resolve(newBlob), 'image/png');
                        };
                        img.onerror = (e) => reject(e);
                        img.src = URL.createObjectURL(blob);
                    });
                } catch (conversionError) {
                    console.warn("Failed to convert image, using original", conversionError);
                }
            }

            const buffer = await blob.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (error) {
            console.warn(`Could not load image from ${url}`, error);
            return null;
        }
    };

    // Process Client Logo
    let logoImageRun = new TextRun("");
    const logoData = await fetchImage(logo);
    if (logoData) {
        logoImageRun = new ImageRun({
            data: logoData,
            transformation: { width: 100, height: 100 },
        });
    }

    // Process Sustenergy Logo from public folder
    let sustenergyLogoRun = new TextRun("");
    const sustLogoData = await fetchImage(window.location.origin + "/sustenergy_logo.png");
    if (sustLogoData) {
        sustenergyLogoRun = new ImageRun({
            data: sustLogoData,
            transformation: { width: 100, height: 80 },
        });
    }

    // Helper to get image dimensions
    const getImageDimensions = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = (e) => reject(e);
            img.src = url;
        });
    };

    // Process Signature
    let signatureRun = new Paragraph({ text: "", spacing: { before: 800 } });
    if (signature) {
        try {
            const sigData = await fetchImage(signature);
            if (sigData) {
                // Get dimensions to preserve aspect ratio
                const dims = await getImageDimensions(signature);

                // Adjusted limits to fit within page width (approx 600px for 9000 DXA)
                const maxWidth = 600;
                const maxHeight = 300;

                let finalWidth = dims.width;
                let finalHeight = dims.height;

                // Calculate ratios
                const widthRatio = maxWidth / finalWidth;
                const heightRatio = maxHeight / finalHeight;

                // Use the smaller ratio to ensure it fits both dimensions (scaling up or down)
                const scale = Math.min(widthRatio, heightRatio, 1); // Ensure we don't upscale indefinitely if not needed, but code below overwrites

                // Correct logic: maintain aspect ratio but fit within box
                if (finalWidth > maxWidth || finalHeight > maxHeight) {
                    const scaleFactor = Math.min(maxWidth / finalWidth, maxHeight / finalHeight);
                    finalWidth = finalWidth * scaleFactor;
                    finalHeight = finalHeight * scaleFactor;
                }


                signatureRun = new Table({
                    layout: TableLayoutType.FIXED,
                    width: { size: 9000, type: WidthType.DXA },
                    columnWidths: [9000], // FIXED: Added missing columnWidths
                    borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new ImageRun({
                                                    data: sigData,
                                                    transformation: { width: finalWidth, height: finalHeight },
                                                }),
                                            ],
                                            alignment: AlignmentType.LEFT,
                                        }),
                                    ],
                                    width: { size: 9000, type: WidthType.DXA },
                                }),
                            ],
                        }),
                    ],
                });
            }
        } catch (err) {
            console.warn("Error processing signature", err);
        }
    }




    // --- Header Construction ---

    // 1. Logos Row (Shared)
    const logosRow = new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({ children: [logoImageRun], alignment: AlignmentType.LEFT })],
                width: { size: 4500, type: WidthType.DXA },
                verticalAlign: "center",
            }),
            new TableCell({
                children: [new Paragraph({ children: [sustenergyLogoRun], alignment: AlignmentType.RIGHT })],
                width: { size: 4500, type: WidthType.DXA },
                verticalAlign: "center",
            }),
        ],
    });

    // 2. Title & Details Row (First Page Only)
    const titleRow = new TableRow({
        children: [
            new TableCell({
                children: [
                    new Paragraph({
                        text: "ELECTRICAL SAFETY AUDIT REPORT",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100, after: 100 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "BRANCH: ", bold: true }),
                            new TextRun(branchName || "-"),
                        ],
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "BRANCH CODE: ", bold: true }),
                            new TextRun(branchCode || "-"),
                        ],
                        alignment: AlignmentType.CENTER,
                    }),
                ],
                columnSpan: 2,
                width: { size: 9000, type: WidthType.DXA },
                verticalAlign: "center",
            }),
        ],
    });

    // Helper to create the boxed table structure - FLATTENED for Mobile Compatibility
    const createBoxedHeader = (rows) => {
        return new Table({
            layout: TableLayoutType.FIXED,
            width: { size: 9000, type: WidthType.DXA },
            columnWidths: [4500, 4500], // CRITICAL: Explicit column widths for FIXED layout
            borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: rows,
        });
    };

    const firstPageTable = createBoxedHeader([logosRow, titleRow]);
    const defaultPageTable = createBoxedHeader([logosRow]);

    // --- Audit Details Section ---

    // Title outside the table
    const auditReportTitle = new Paragraph({
        text: "Electrical Audit Report",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
        spacing: { before: 400, after: 200 },
    });

    // 2-Column Details Table with Shading
    const detailsRow = (label, value, shade = false) => {
        const shadeConfig = shade ? { fill: "D9E2F3", type: ShadingType.CLEAR, color: "auto" } : undefined;
        return new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
                    shading: shadeConfig,
                    width: { size: 3000, type: WidthType.DXA }, // Fixed 3000 DXA (~5.3cm)
                }),
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: value || "-" })] })],
                    shading: shadeConfig,
                    width: { size: 6000, type: WidthType.DXA }, // Fixed 6000 DXA (~10.6cm)
                }),
            ],
        });
    };

    const auditDetailsTable = new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [3000, 6000], // CRITICAL: Defines the grid columns
        borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
        },
        rows: [
            detailsRow("Reference no", refNo, true),
            detailsRow("Dated", date, false),
            detailsRow("Inspection date", inspectionDate, true),
            detailsRow("Client", client, false),
        ],
    });

    // --- Content Sections with Bookmarks ---

    // 3. General Observations
    const obsSection = [
        new Paragraph({
            children: [
                new BookmarkStart("bookmark_obs"),
                new TextRun("1.0 Audit - General observations"),
                new BookmarkEnd("bookmark_obs"),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
            text: generalObservations,
            spacing: { after: 200 },
        }),
    ];

    // 4. Snapshots
    // 4. Snapshots (Grouped Logic)
    const snapshotRows = [];
    let slNo = 1;

    for (const group of snapshots) {
        // If group has no images but has description
        if ((!group.images || group.images.length === 0) && group.description) {
            snapshotRows.push(
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(slNo.toString())] }),
                        new TableCell({ children: [new Paragraph("No Image")] }),
                        new TableCell({ children: [new Paragraph(group.description)] }),
                    ],
                })
            );
            slNo++;
            continue;
        }

        // Iterate through images in the group
        if (group.images && group.images.length > 0) {
            for (let i = 0; i < group.images.length; i++) {
                const imgUrl = group.images[i];
                let imageChild = new Paragraph("Error Loading Image");

                const imageData = await fetchImage(imgUrl);
                if (imageData) {
                    imageChild = new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageData,
                                transformation: {
                                    width: 300,
                                    height: 200,
                                },
                            }),
                        ],
                    });
                }

                // First image gets the description and Sl No. Subsequent images in the same group get empty/ditto.
                const isFirst = i === 0;

                snapshotRows.push(
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(isFirst ? slNo.toString() : "")] }),
                            new TableCell({ children: [imageChild] }),
                            new TableCell({ children: [new Paragraph(isFirst ? group.description : "")] }),
                        ],
                    })
                );
            }
            slNo++;
        }
    }

    const snapshotTable = new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [1000, 5000, 3000],
        rows: [
            new TableRow({
                children: [
                    createCell("Sl. No", true),
                    createCell("Image", true),
                    createCell("Description", true),
                ],
            }),
            ...snapshotRows
        ],
    });

    const snapshotSection = [
        new Paragraph({
            children: [
                new BookmarkStart("bookmark_snap"),
                new TextRun("2.0 Snapshots of Electrical Installation"),
                new BookmarkEnd("bookmark_snap"),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        }),
        snapshotTable,
    ];

    // 5. Power Parameters
    const pp = powerParameters;
    const powerTable = new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [2500, 1500, 2500, 2500],
        rows: [
            new TableRow({ children: [createCell("Parameter", true), createCell("Test Point", true), createCell("Value", true), createCell("Remarks", true)] }),
            // Line Voltage
            new TableRow({ children: [createCell("Line Voltage"), createCell("RY"), createCell(pp.lineVoltage.ry), createCell("")] }),
            new TableRow({ children: [createCell(""), createCell("YB"), createCell(pp.lineVoltage.yb), createCell("")] }),
            new TableRow({ children: [createCell(""), createCell("BR"), createCell(pp.lineVoltage.br), createCell("")] }),
            // Phase Voltage
            new TableRow({ children: [createCell("Phase Voltage"), createCell("R-N"), createCell(pp.phaseVoltage.rn), createCell("")] }),
            new TableRow({ children: [createCell(""), createCell("Y-N"), createCell(pp.phaseVoltage.yn), createCell("")] }),
            new TableRow({ children: [createCell(""), createCell("B-N"), createCell(pp.phaseVoltage.bn), createCell("")] }),
            // Neutral to Earth
            new TableRow({ children: [createCell("Neutral to Earth"), createCell("N-E"), createCell(pp.neutralEarth.ne), createCell("")] }),
            // Current
            new TableRow({ children: [createCell("Current"), createCell("R"), createCell(pp.current.r), createCell("")] }),
            new TableRow({ children: [createCell(""), createCell("Y"), createCell(pp.current.y), createCell("")] }),
            new TableRow({ children: [createCell(""), createCell("B"), createCell(pp.current.b), createCell("")] }),
            new TableRow({ children: [createCell(""), createCell("N"), createCell(pp.current.n), createCell("")] }),
            // Freq & PF
            new TableRow({ children: [createCell("Frequency"), createCell(""), createCell(pp.frequency), createCell("")] }),
            new TableRow({ children: [createCell("Power factor"), createCell(""), createCell(pp.powerFactor), createCell("")] }),
        ],
    });

    const powerSection = [
        new Paragraph({
            children: [
                new BookmarkStart("bookmark_power"),
                new TextRun("3.0 Power Parameters"),
                new BookmarkEnd("bookmark_power"),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        }),
        powerTable,
    ];

    // 6. Connected Load
    const loadRows = connectedLoad.map((load, index) => (
        new TableRow({
            children: [
                createCell((index + 1).toString()),
                createCell(load.type),
                createCell(load.power),
                createCell(load.qty),
                createCell(load.subTotal),
            ],
        })
    ));

    const totalLoad = connectedLoad.reduce((acc, curr) => acc + (parseFloat(curr.subTotal) || 0), 0);

    const loadTable = new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [700, 3800, 1500, 1000, 2000],
        rows: [
            new TableRow({ children: [createCell("Sl. No", true), createCell("Type of Load", true), createCell("Power (W)", true), createCell("Quantity (Nos)", true), createCell("Sub Total (KW)", true)] }),
            ...loadRows,
            new TableRow({ children: [createCell(""), createCell("Connected load in KW", true), createCell(""), createCell(""), createCell(totalLoad.toFixed(2), true)] }),
        ],
    });

    const loadSection = [
        new Paragraph({
            children: [
                new BookmarkStart("bookmark_load"),
                new TextRun("4.0 Connected Load Detail"),
                new BookmarkEnd("bookmark_load"),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        }),
        loadTable,
    ];

    // 7. Conclusions
    const conclusionItems = conclusions.map(c => new Paragraph({
        text: c,
        bullet: { level: 0 },
    }));

    const conclusionSection = [
        new Paragraph({
            children: [
                new BookmarkStart("bookmark_conc"),
                new TextRun("5.0 Conclusions"),
                new BookmarkEnd("bookmark_conc"),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        }),
        ...conclusionItems,
    ];

    // 8. Footer / Signatory
    const footerSection = [
        new Paragraph({ text: "", spacing: { before: 800 } }),
        new Paragraph({ text: "For Sustenergy Foundation", bold: true }),
        signatureRun,
        new Paragraph({ text: "Jayakumar.R", bold: true }),
        new Paragraph({ text: "Principal Consultant." }),
        new Paragraph({ text: "Certified Energy Manager – EM 0514 – Bureau of Energy efficiency, India" }),
        new Paragraph({ text: "Supervisor Grade A – SA 1387- All LT/MV/HT Electrical Installation, KSELB, Kerala State" }),
        new Paragraph({ text: "Certified Infrared Thermographer Level 1 – No 2017IN08N002 - Infrared Training Center, Sweden" }),
        new Paragraph({ text: "", spacing: { before: 600 } }),
        // Footer Image removed as per user request
    ];

    // --- TOC Page Construction (Manual Boxed) ---
    const tocRows = [
        { sl: "1", desc: "1.0 Audit - General observations", link: "bookmark_obs" },
        { sl: "2", desc: "2.0 Snapshots of Electrical Installation", link: "bookmark_snap" },
        { sl: "3", desc: "3.0 Power Parameters", link: "bookmark_power" },
        { sl: "4", desc: "4.0 Connected Load Detail", link: "bookmark_load" },
        { sl: "5", desc: "5.0 Conclusions", link: "bookmark_conc" },
    ];

    const tocTable = new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [1000, 6000, 2000],
        rows: [
            // Header
            new TableRow({
                children: [
                    createCell("Sl. No", true),
                    createCell("Description", true),
                    createCell("Page No", true),
                ],
            }),
            // Links
            ...tocRows.map(item => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: item.sl, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph(item.desc)] }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new SimpleField(`PAGEREF ${item.link}`),
                                ],
                                alignment: AlignmentType.CENTER,
                            })
                        ],
                    }),
                ],
            }))
        ],
    });

    const tocSection = [
        new Paragraph({
            text: "Table of Contents",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
            pageBreakBefore: false,
            color: "2F5496" // Blue color for TOC Title
        }),
        tocTable,
        new Paragraph({ text: "", pageBreakBefore: true }), // Break AFTER TOC to start content
    ];

    console.log("Generating document with data:", data);

    try {
        const doc = new Document({
            features: {
                updateFields: true,
            },
            sections: [{
                properties: {
                    titlePage: true, // IMPORTANT: Enables distinct first page header
                    page: {
                        margin: {
                            top: "2.5cm",
                            bottom: "2.5cm",
                            left: "2.5cm",
                            right: "2.5cm",
                        },
                    },
                },
                headers: {
                    first: new Header({
                        children: [firstPageTable],
                    }),
                    default: new Header({
                        children: [defaultPageTable],
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Table({
                                layout: TableLayoutType.FIXED,
                                width: { size: 9000, type: WidthType.DXA },
                                columnWidths: [4500, 4500], // CRITICAL: Explicit column widths for FIXED layout
                                borders: {
                                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph("Electrical Audit Report")],
                                                verticalAlign: "center",
                                                width: { size: 4500, type: WidthType.DXA },
                                                borders: { bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        alignment: AlignmentType.RIGHT,
                                                        children: [
                                                            new TextRun({
                                                                children: [PageNumber.CURRENT],
                                                            }),
                                                        ],
                                                    }),
                                                ],
                                                verticalAlign: "center",
                                                width: { size: 4500, type: WidthType.DXA },
                                                borders: { bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                                            }),
                                        ],
                                    }),
                                ],
                            })
                        ],
                    }),
                },
                children: [
                    // Page 1 Content (Empty, header covers it)
                    new Paragraph({ text: "", spacing: { after: 0 } }),
                    new PageBreak(),

                    // Page 2: Audit Details + TOC
                    auditReportTitle,
                    auditDetailsTable,
                    new Paragraph({ text: "", spacing: { after: 200 } }), // Gap
                    ...tocSection,
                    // Note: tocSection now ends with a PageBreak

                    // Page 3+: Main Content
                    // Note: auditDetails was removed from here, as it's now on Page 2
                    ...obsSection,
                    ...snapshotSection,
                    ...powerSection,
                    ...loadSection,
                    ...conclusionSection,
                    ...footerSection
                ],
            }],
        });

        const buffer = await Packer.toBuffer(doc);
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

        const safeBranchName = (branchName || "Draft").replace(/[^a-z0-9\s-_]/gi, '').trim().replace(/\s+/g, '_');
        const fileName = "Audit_Report_" + safeBranchName + ".docx";

        console.log("Saving file:", fileName);
        saveAs(blob, fileName);
        console.log("File saved successfully");
    } catch (error) {
        console.error("Error generating document:", error);
        alert("Error generating document. Please check console for details.");
    }
};

