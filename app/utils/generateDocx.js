
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, WidthType, BorderStyle, HeadingLevel, AlignmentType, Header, Footer, PageNumber, PageBreak } from "docx";
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
        logo // Extract logo
    } = data;

    // Helper to create table cells
    const createCell = (text, bold = false) => {
        return new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: text || "-", bold })] })],
            verticalAlign: "center",
        });
    };

    // Process Client Logo
    let logoImageRun = new TextRun("");
    if (logo) {
        try {
            const response = await fetch(logo);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            logoImageRun = new ImageRun({
                data: new Uint8Array(buffer),
                transformation: { width: 100, height: 100 },
            });
        } catch (e) {
            console.error("Error processing client logo", e);
        }
    }

    // Process Sustenergy Logo from public folder
    let sustenergyLogoRun = new TextRun("");
    try {
        const response = await fetch(window.location.origin + "/sustenergy_logo.png");
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        sustenergyLogoRun = new ImageRun({
            data: new Uint8Array(buffer),
            transformation: { width: 100, height: 80 },
        });
    } catch (e) {
        console.error("Error processing sustenergy logo", e);
    }

    // --- Header Construction ---

    // 1. Logos Row (Shared)
    const logosRow = new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({ children: [logoImageRun], alignment: AlignmentType.LEFT })],
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: "center",
            }),
            new TableCell({
                children: [new Paragraph({ children: [sustenergyLogoRun], alignment: AlignmentType.RIGHT })],
                width: { size: 50, type: WidthType.PERCENTAGE },
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
                width: { size: 100, type: WidthType.PERCENTAGE },
                verticalAlign: "center",
            }),
        ],
    });

    // Helper to create the boxed table structure
    const createBoxedHeader = (rows) => {
        const contentTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: rows,
        });

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [contentTable],
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            margins: { top: 200, bottom: 200, left: 200, right: 200 },
                        }),
                    ],
                }),
            ],
        });
    };

    const firstPageTable = createBoxedHeader([logosRow, titleRow]);
    const defaultPageTable = createBoxedHeader([logosRow]);

    // 2. Audit Details (Rest of the body)
    const auditDetails = [
        new Paragraph({
            text: "Electrical Audit Report",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "Reference no: ", bold: true }),
                new TextRun(refNo),
                new TextRun({ text: "\tDated: ", bold: true }),
                new TextRun(date),
            ],
            tabStops: [{ type: "right", position: 9000 }],
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "Inspection date: ", bold: true }),
                new TextRun(inspectionDate),
            ],
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "Client: ", bold: true }),
                new TextRun(client),
            ],
            spacing: { after: 300 },
        }),
    ];

    // 3. General Observations
    const obsSection = [
        new Paragraph({
            text: "1.0 Audit - General observations",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
            text: generalObservations,
            spacing: { after: 200 },
        }),
    ];

    // 4. Snapshots
    const snapshotRows = await Promise.all(snapshots.map(async (snap, index) => {
        let imageChild = new Paragraph("No Image");
        if (snap.image) {
            try {
                const response = await fetch(snap.image);
                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();
                imageChild = new Paragraph({
                    children: [
                        new ImageRun({
                            data: new Uint8Array(buffer),
                            transformation: {
                                width: 300,
                                height: 200,
                            },
                        }),
                    ],
                });
            } catch (e) {
                console.error("Error processing image", e);
            }
        }

        return new TableRow({
            children: [
                new TableCell({ children: [new Paragraph((index + 1).toString())] }),
                new TableCell({ children: [imageChild] }),
                new TableCell({ children: [new Paragraph(snap.description)] }),
            ],
        });
    }));

    const snapshotTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1000, 5000, 3000], // Explicit widths for 3 columns
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
            text: "2.0 Snapshots of Electrical Installation",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        }),
        snapshotTable,
    ];

    // 5. Power Parameters
    const pp = powerParameters;
    const powerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 1500, 2500, 2500], // Explicit widths for 4 columns
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
            text: "3.0 Power Parameters",
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
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1000, 4000, 1500, 1500, 1500], // Explicit widths for 5 columns
        rows: [
            new TableRow({ children: [createCell("Sl. No", true), createCell("Type of Load", true), createCell("Power (W)", true), createCell("Quantity (Nos)", true), createCell("Sub Total (KW)", true)] }),
            ...loadRows,
            new TableRow({ children: [createCell(""), createCell("Connected load in KW", true), createCell(""), createCell(""), createCell(totalLoad.toFixed(2), true)] }),
        ],
    });

    const loadSection = [
        new Paragraph({
            text: "4.0 Connected Load Detail",
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
            text: "5.0 Conclusions",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
        }),
        ...conclusionItems,
    ];

    // 8. Footer / Signatory
    const footerSection = [
        new Paragraph({ text: "", spacing: { before: 800 } }),
        new Paragraph({ text: "For Sustenergy Foundation", bold: true }),
        new Paragraph({ text: "", spacing: { before: 800 } }),
        new Paragraph({ text: "Jayakumar.R", bold: true }),
        new Paragraph({ text: "Principal Consultant." }),
        new Paragraph({ text: "Certified Energy Manager – EM 0514 – Bureau of Energy efficiency, India" }),
        new Paragraph({ text: "Supervisor Grade A – SA 1387- All LT/MV/HT Electrical Installation, KSELB, Kerala State" }),
        new Paragraph({ text: "Certified Infrared Thermographer Level 1 – No 2017IN08N002 - Infrared Training Center, Sweden" }),
    ];

    // --- TOC Page Construction ---
    const tocTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1000, 5000, 2000, 2000],
        rows: [
            // Header Row
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Sl. No", bold: true, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: "Description", bold: true, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: "Page start", bold: true, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: "Page end", bold: true, alignment: AlignmentType.CENTER })] }),
                ],
            }),
            // Row 1: Audit report
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "1", alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph("Audit report")] }),
                    new TableCell({ children: [new Paragraph({ text: "3", alignment: AlignmentType.CENTER })] }), // Starts after Cover + TOC
                    new TableCell({ children: [new Paragraph({ text: "-", alignment: AlignmentType.CENTER })] }), // Dynamic end unknown
                ],
            }),
            // Row 2: Annexure#1
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "2", alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph("Annexure#1 Checklist")] }),
                    new TableCell({ children: [new Paragraph({ text: "-", alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: "-", alignment: AlignmentType.CENTER })] }),
                ],
            }),
            // Row 3: Annexure#2
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "3", alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph("Annexure#2 Thermal Imaging Report")] }),
                    new TableCell({ children: [new Paragraph({ text: "-", alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: "-", alignment: AlignmentType.CENTER })] }),
                ],
            }),
        ],
    });

    const tocSection = [
        new Paragraph({
            text: "Table of contents",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 },
        }),
        tocTable,
    ];

    console.log("Generating document with data:", data);

    try {
        const doc = new Document({
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
                                width: { size: 100, type: WidthType.PERCENTAGE },
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
                                                width: { size: 50, type: WidthType.PERCENTAGE },
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
                                                width: { size: 50, type: WidthType.PERCENTAGE },
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

                    // Page 2: Table of Contents
                    ...tocSection,
                    new PageBreak(),

                    // Page 3+: Main Content
                    ...auditDetails,
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
