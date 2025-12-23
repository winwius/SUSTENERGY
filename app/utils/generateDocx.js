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
    TableLayoutType,
    VerticalAlign
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
        if (document.body.contains(a)) {
            document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(url);
    }, 500);
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
 * Helper to load image and get its dimensions
 */
function getImageDimensions(url) {
    return new Promise((resolve) => {
        if (!url) return resolve(null);
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve(null);
        img.src = url;
    });
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
 * Headers have customizable background color with white text
 * @param {Array} cells - Array of cell values
 * @param {boolean} isHeader - Whether this is a header row
 * @param {string} headerColor - Hex color for header background (default: teal #2DD4BF)
 */
function createDataRow(cells, isHeader = false, headerColor = "2DD4BF") {
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
                                color: isHeader ? "FFFFFF" : "4B5563"
                            })
                        ],
                        alignment: index === 0 ? AlignmentType.LEFT : AlignmentType.CENTER
                    })
                ],
                shading: isHeader ? { fill: headerColor } : undefined,
                margins: {
                    top: 80,
                    bottom: 80,
                    left: 100,
                    right: 100
                },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                    left: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                    right: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" }
                }
            })
        )
    });
}

/**
 * Create paragraphs from text with preserved line breaks
 * @param {string} text - Text content that may contain line breaks
 * @param {object} options - Styling options
 * @returns {Array} Array of Paragraph objects
 */
/**
 * Create paragraphs from HTML content (handles <b>, <i>, <ul>, <li>, etc.)
 * @param {string} html - HTML content from rich text editor
 * @param {object} options - Default styling options
 */
/**
 * Helper to convert color values to 6-digit HEX format required by docx
 */
function normalizeColor(color) {
    if (!color) return undefined;

    // If it's already a hex (with or without #)
    if (color.startsWith('#')) {
        return color.replace('#', '').substring(0, 6).toUpperCase();
    }

    // Handle rgb(r, g, b) or rgba(r, g, b, a)
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return (r + g + b).toUpperCase();
    }

    // If it's already a 6-digit hex like string
    if (/^[0-9A-Fa-f]{6}$/.test(color)) {
        return color.toUpperCase();
    }

    return undefined;
}

/**
 * Creates paragraphs from HTML content using DOMParser for reliability
 * @param {string} html - HTML content from rich text editor
 * @param {object} options - Default styling options
 */
function createTextParagraphs(html, options = {}) {
    if (!html) return [];

    const {
        size = 24,
        color = "374151",
        spacing = { after: 120 }
    } = options;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html || "", 'text/html');
    const root = doc.body;
    const paragraphs = [];

    // Tracks current list state
    let listStack = [];

    const processNode = (node, currentStyles = {}, alignment = AlignmentType.LEFT) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text) {
                return [new TextRun({
                    text: text,
                    bold: currentStyles.bold || false,
                    italics: currentStyles.italic || false,
                    underline: currentStyles.underline ? {} : undefined,
                    size: size,
                    color: currentStyles.color || color
                })];
            }
            return [];
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            const styles = { ...currentStyles };

            // Handle inline styles
            if (tag === 'b' || tag === 'strong') styles.bold = true;
            if (tag === 'i' || tag === 'em') styles.italic = true;
            if (tag === 'u') styles.underline = true;
            if (tag === 'span') {
                if (node.style.fontWeight === 'bold' || node.style.fontWeight > 500) styles.bold = true;
                if (node.style.fontStyle === 'italic') styles.italic = true;
                if (node.style.textDecoration.includes('underline')) styles.underline = true;
                if (node.style.color) styles.color = normalizeColor(node.style.color);
            }

            // Handle alignment (only if not already set by parent)
            let nodeAlignment = alignment;
            const textAlign = node.style.textAlign || node.getAttribute('align');
            if (textAlign === 'center') nodeAlignment = AlignmentType.CENTER;
            else if (textAlign === 'right') nodeAlignment = AlignmentType.RIGHT;
            else if (textAlign === 'justify') nodeAlignment = AlignmentType.JUSTIFIED;

            // Block elements create paragraphs
            const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'];
            const listTags = ['ul', 'ol'];

            if (blockTags.includes(tag)) {
                const children = [];
                node.childNodes.forEach(child => {
                    children.push(...processNode(child, styles, nodeAlignment));
                });

                // Get numbering if inside a list
                let numbering = undefined;
                if (tag === 'li') {
                    const parentTag = node.parentNode.tagName.toLowerCase();
                    if (parentTag === 'ol') {
                        numbering = { reference: 'ordered-list', level: 0 };
                    } else {
                        numbering = { reference: 'unordered-list', level: 0 };
                    }
                }

                paragraphs.push(new Paragraph({
                    children: children,
                    alignment: nodeAlignment,
                    numbering: numbering,
                    spacing: spacing
                }));
                return []; // Already added as paragraph
            } else if (listTags.includes(tag)) {
                node.childNodes.forEach(child => {
                    processNode(child, styles, nodeAlignment);
                });
                return [];
            } else if (tag === 'br') {
                return [new TextRun({ text: "", break: 1 })];
            } else {
                // Non-block element, just process children and return segments
                const segments = [];
                node.childNodes.forEach(child => {
                    segments.push(...processNode(child, styles, nodeAlignment));
                });
                return segments;
            }
        }
        return [];
    };

    // Process top-level nodes
    root.childNodes.forEach(node => {
        const segments = processNode(node);
        // If segments remain (e.g. top level text node), wrap in paragraph
        if (segments.length > 0) {
            paragraphs.push(new Paragraph({
                children: segments,
                alignment: AlignmentType.LEFT,
                spacing: spacing
            }));
        }
    });

    // Fallback
    if (paragraphs.length === 0 && html) {
        const text = html.replace(/<[^>]*>?/gm, '').trim();
        if (text) {
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text: text, size, color })],
                spacing: spacing
            }));
        }
    }

    return paragraphs;
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
        createdBy,
        approvedBy,
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

    // ========== DUAL LOGO HEADER (in document body for mobile compatibility) ==========
    const LOGO_TARGET_SIZE = 80;

    // Load client logo
    let clientLogoBytes = null;
    let clientLogoDims = null;
    if (logo) {
        try {
            clientLogoBytes = await convertImageToBytes(logo);
            clientLogoDims = await getImageDimensions(logo);
        } catch (error) {
            console.error('Error loading client logo:', error);
        }
    }

    // Load Sustenergy logo
    let sustLogoBytes = null;
    let sustLogoDims = null;
    const sustLogoUrl = window.location.origin + "/sustenergy_logo.png";
    try {
        sustLogoBytes = await convertImageToBytes(sustLogoUrl);
        sustLogoDims = await getImageDimensions(sustLogoUrl);
    } catch (error) {
        console.error('Error loading Sustenergy logo:', error);
    }

    // Calculate transformations
    const getTransformation = (dims) => {
        if (!dims) return { width: LOGO_TARGET_SIZE, height: LOGO_TARGET_SIZE };
        const ratio = dims.width / dims.height;
        let w = LOGO_TARGET_SIZE, h = LOGO_TARGET_SIZE;
        if (ratio > 1) h = LOGO_TARGET_SIZE / ratio;
        else w = LOGO_TARGET_SIZE * ratio;
        return { width: Math.round(w), height: Math.round(h) };
    };

    const clientLogoTransform = getTransformation(clientLogoDims);
    const sustLogoTransform = getTransformation(sustLogoDims);

    // Build logo row for document body
    // Left cell with client logo
    let leftLogoCell = new TableCell({
        children: clientLogoBytes ? [
            new Paragraph({
                children: [
                    new ImageRun({
                        data: clientLogoBytes,
                        transformation: clientLogoTransform
                    })
                ],
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0 }
            })
        ] : [new Paragraph({ text: "" })],
        width: { size: 4680, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
        }
    });

    // Right cell with Sustenergy logo
    let rightLogoCell = new TableCell({
        children: sustLogoBytes ? [
            new Paragraph({
                children: [
                    new ImageRun({
                        data: sustLogoBytes,
                        transformation: sustLogoTransform
                    })
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 }
            })
        ] : [new Paragraph({ text: "" })],
        width: { size: 4680, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
        }
    });

    // Add logo table to document body
    documentChildren.push(
        new Table({
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
                    children: [leftLogoCell, rightLogoCell]
                })
            ]
        })
    );

    // Add spacing after logo
    documentChildren.push(
        new Paragraph({
            text: "",
            spacing: { after: 200 }
        })
    );

    // ========== PAGE 1: COVER PAGE ==========
    // Add vertical spacing to center content
    documentChildren.push(
        new Paragraph({
            text: "",
            spacing: { after: 1200 }
        })
    );

    // ========== TITLE ==========
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "ELECTRICAL SAFETY AUDIT REPORT",
                    bold: true,
                    size: 52,
                    color: "2563EB"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
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
                        size: 32,
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
                        size: 28,
                        color: "6B7280"
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
            })
        );
    }

    // ========== GENERAL INFORMATION TABLE (No heading, centered on cover) ==========
    const infoRows = [];
    if (refNo) infoRows.push(createTableRow("Reference No", refNo));
    if (date) infoRows.push(createTableRow("Report Date", formatDate(date)));
    if (inspectionDate) infoRows.push(createTableRow("Inspection Date", formatDate(inspectionDate)));
    if (client) infoRows.push(createTableRow("Client", client));
    if (createdBy) infoRows.push(createTableRow("Created By", createdBy));
    if (approvedBy) infoRows.push(createTableRow("Approved By", approvedBy));

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

    // Add page break after cover page
    documentChildren.push(
        new Paragraph({
            text: "",
            pageBreakBefore: true
        })
    );

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
                top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" }
            },
            rows: [tocHeaderRow, ...tocDataRows]
        })
    );

    // ========== GENERAL OBSERVATIONS ==========
    if (generalObservations && generalObservations.length > 0) {
        documentChildren.push(
            new Paragraph({
                pageBreakBefore: true,
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

        generalObservations.forEach((observation) => {
            if (observation && observation.trim() !== "") {
                const paragraphs = createTextParagraphs(observation, {
                    size: 24,
                    color: "374151",
                    spacing: { after: 200 }
                });
                documentChildren.push(...paragraphs);
            }
        });
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
                // Preserve line breaks within each highlight
                const highlightParagraphs = createTextParagraphs(highlight, {
                    size: 24,
                    color: "374151",
                    spacing: { after: 150 }
                });
                documentChildren.push(...highlightParagraphs);
            }
        });
    }
    // ========== SNAPSHOTS ==========
    if (snapshots && snapshots.length > 0) {
        documentChildren.push(
            new Paragraph({
                pageBreakBefore: true,
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

        // Create snapshot table header row with purple background (#8B5CF6) to match title
        const snapshotHeaderRow = new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Sl. No", bold: true, size: 24, color: "FFFFFF" })],
                            alignment: AlignmentType.CENTER
                        })
                    ],
                    shading: { fill: "8B5CF6" },
                    width: { size: 936, type: WidthType.DXA },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Image", bold: true, size: 24, color: "FFFFFF" })]
                        })
                    ],
                    shading: { fill: "8B5CF6" },
                    width: { size: 3744, type: WidthType.DXA },
                    margins: { top: 100, bottom: 100, left: 150, right: 100 }
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Description", bold: true, size: 24, color: "FFFFFF" })]
                        })
                    ],
                    shading: { fill: "8B5CF6" },
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
                                children: description ? createTextParagraphs(description, { size: 22, color: "374151", spacing: { after: 50 } }) : [new Paragraph({ text: "" })],
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
                                        }
                                    })
                                ]
                            });
                        }
                    } catch (error) {
                        console.error('Error processing snapshot image:', error);
                    }

                    // Construct row children
                    const rowChildren = [];

                    // 1. Sl No Column (Merged)
                    if (i === 0) {
                        rowChildren.push(
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: slNo.toString(), size: 24, color: "374151" })],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                rowSpan: groupImages.length, // Merge vertically
                                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }
                            })
                        );
                    }

                    // 2. Image Column (Always present)
                    rowChildren.push(
                        new TableCell({
                            children: [imageContent],
                            margins: { top: 100, bottom: 100, left: 100, right: 100 },
                            borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }
                        })
                    );

                    // 3. Description Column (Merged)
                    if (i === 0) {
                        rowChildren.push(
                            new TableCell({
                                children: description
                                    ? createTextParagraphs(description, { size: 22, color: "374151", spacing: { after: 50 } })
                                    : [new Paragraph({ text: "" })],
                                rowSpan: groupImages.length, // Merge vertically
                                margins: { top: 100, bottom: 100, left: 150, right: 100 },
                                borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } }
                            })
                        );
                    }

                    snapshotDataRows.push(new TableRow({ children: rowChildren }));
                }
                slNo++;
            }
        }

        // Add the snapshots table with visible borders
        documentChildren.push(
            new Table({
                layout: TableLayoutType.FIXED,
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [936, 3744, 4680],
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                    left: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                    right: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" }
                },
                rows: [snapshotHeaderRow, ...snapshotDataRows]
            })
        );
    }

    // ========== POWER PARAMETERS ==========
    if (powerParameters) {
        documentChildren.push(
            new Paragraph({
                pageBreakBefore: true,
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
        const remarks = pp.remarks || {};
        // Orange header (#F59E0B) to match title color
        const powerRows = [
            createDataRow(["Parameter", "Test Point", "Value", "Remarks"], true, "F59E0B"),
            createDataRow(["Line Voltage", "RY", pp.lineVoltage?.ry || "", remarks.ry || ""]),
            createDataRow(["", "YB", pp.lineVoltage?.yb || "", remarks.yb || ""]),
            createDataRow(["", "BR", pp.lineVoltage?.br || "", remarks.br || ""]),
            createDataRow(["Phase Voltage", "R-N", pp.phaseVoltage?.rn || "", remarks.rn || ""]),
            createDataRow(["", "Y-N", pp.phaseVoltage?.yn || "", remarks.yn || ""]),
            createDataRow(["", "B-N", pp.phaseVoltage?.bn || "", remarks.bn || ""]),
            createDataRow(["Neutral to Earth", "N-E", pp.neutralEarth?.ne || "", remarks.ne || ""]),
            createDataRow(["Current", "R", pp.current?.r || "", remarks.r || ""]),
            createDataRow(["", "Y", pp.current?.y || "", remarks.y || ""]),
            createDataRow(["", "B", pp.current?.b || "", remarks.b || ""]),
            createDataRow(["", "N", pp.current?.n || "", remarks.n || ""]),
            createDataRow(["Frequency", "", pp.frequency || "", remarks.frequency || ""]),
            createDataRow(["Power Factor", "", pp.powerFactor || "", remarks.powerFactor || ""])
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
                pageBreakBefore: true,
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

        // Red header (#EF4444) to match title color
        const loadRows = [
            createDataRow(["Sl. No", "Type of Load", "Power (W)", "Qty", "Sub Total (KW)"], true, "EF4444"),
            ...connectedLoad.map((load, index) =>
                createDataRow([index + 1, load.type, load.power, load.qty, load.subTotal])
            )
        ];

        // Calculate total
        const totalLoad = connectedLoad.reduce((acc, curr) => acc + (parseFloat(curr.subTotal) || 0), 0);
        loadRows.push(createDataRow(["", "Connected load in KW", "", "", totalLoad.toFixed(2)], true, "EF4444"));

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
                pageBreakBefore: true,
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
            if (conclusion.trim() !== "") {
                // Preserve line breaks within each conclusion
                const conclusionParagraphs = createTextParagraphs(conclusion, {
                    size: 24,
                    color: "374151",
                    spacing: { after: 150 }
                });
                documentChildren.push(...conclusionParagraphs);
            }
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
                                }
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
            spacing: { after: 400 }
        })
    );

    // ========== ORGANIZATION FOOTER ==========
    // Reg. office line
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Reg. office: - Mathuvala, Kudamaloor.P.O, Kottayam -17, Kerala state, India Ph:- +91 481 6454636 , +91 9020093636", size: 18, color: "374151" })
            ],
            spacing: { after: 50 }
        })
    );

    // Marketing Office line
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Marketing Office :- 277 N Pathinaruparayil Arcade, Chalukunnu, Kottayam.P.O, Kerala State 686 001", size: 18, color: "374151" })
            ],
            spacing: { after: 50 }
        })
    );

    // Email and Website line
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Email:- contact@sustenergyfoundation.org   website:- ", size: 18, color: "374151" }),
                new TextRun({ text: "www.sustenergyfoundation.org", size: 18, color: "0000FF" })
            ],
            spacing: { after: 100 }
        })
    );

    // Countries line with yellow highlighting
    documentChildren.push(
        new Paragraph({
            children: [
                new TextRun({ text: "India", bold: true, size: 24, color: "000000", shading: { fill: "FFFF00" } }),
                new TextRun({ text: "          ", size: 24, shading: { fill: "FFFF00" } }),
                new TextRun({ text: "Maldives", bold: true, size: 24, color: "000000", shading: { fill: "FFFF00" } }),
                new TextRun({ text: "          ", size: 24, shading: { fill: "FFFF00" } }),
                new TextRun({ text: "Sri Lanka", bold: true, size: 24, color: "000000", shading: { fill: "FFFF00" } }),
                new TextRun({ text: "          ", size: 24, shading: { fill: "FFFF00" } }),
                new TextRun({ text: "Nepal", bold: true, size: 24, color: "000000", shading: { fill: "FFFF00" } }),
                new TextRun({ text: "          ", size: 24, shading: { fill: "FFFF00" } }),
                new TextRun({ text: "UAE", bold: true, size: 24, color: "000000", shading: { fill: "FFFF00" } })
            ],
            spacing: { before: 100, after: 200 }
        })
    );


    // ========== HEADER (empty - logos moved to document body for mobile compatibility) ==========
    const headerChildren = [];
    // Header is intentionally empty - logos are in the document body for better mobile support

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
    let doc;
    try {
        console.log("Constructing DOCX object...");
        doc = new Document({
            numbering: {
                config: [
                    {
                        reference: "ordered-list",
                        levels: [
                            {
                                level: 0,
                                format: "decimal",
                                text: "%1.",
                                style: {
                                    paragraph: {
                                        indent: { left: 720, hanging: 360 },
                                    },
                                },
                            },
                        ],
                    },
                    {
                        reference: "unordered-list",
                        levels: [
                            {
                                level: 0,
                                format: "bullet",
                                text: "\u25CF",
                                style: {
                                    paragraph: {
                                        indent: { left: 720, hanging: 360 },
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
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
        console.log("DOCX object constructed successfully.");
    } catch (error) {
        console.error("Error constructing DOCX object:", error);
        alert("Error preparing document content: " + error.message);
        return;
    }

    // Generate and save file
    try {
        console.log("Packing DOCX to blob...");
        const blob = await Packer.toBlob(doc);

        const namePart = (branchName || "Audit").toString().trim().replace(/[^a-z0-9]/gi, '_') || "Report";
        const fileName = `Audit_Report_${namePart}.docx`;

        console.log("Saving file:", fileName);
        downloadFile(blob, fileName);
        console.log("File saved successfully:", fileName);
    } catch (error) {
        console.error("Error packing or downloading document:", error);
        alert("Error during file generation: " + error.message);
    }
};
