import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePdf = async (data) => {
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

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;

    // --- Helper Functions ---
    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            if (!url) resolve(null);
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => resolve(null); // Fail gracefully
            img.src = url;
            // Handle cors if needed, but data urls are effectively local
            if (url.startsWith('http')) img.crossOrigin = "Anonymous";
        });
    };

    const addText = (text, x, y, size = 10, align = "left", weight = "normal") => {
        // Strip HTML tags for PDF text as fallback
        const cleanText = (text || "").replace(/<[^>]*>?/gm, '');
        doc.setFontSize(size);
        doc.setFont("helvetica", weight);
        doc.text(cleanText, x, y, { align: align });
    };

    /**
     * Splits HTML into paragraphs and segments for rich text rendering in PDF
     */
    const parseHtmlForPdf = (html) => {
        if (!html) return [];

        // Replace <br> and other block-like tags that should start a new line
        // but keep the tag structure for segmenting
        let processedHtml = html.replace(/<br\s*\/?>/gi, '</p><p>');

        // Split into block elements (paragraphs, div, li)
        const blockTags = ['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        const splitRegex = new RegExp(`(<(?:${blockTags.join('|')})[^>]*>|<\\/(?:${blockTags.join('|')})>)`, 'i');
        const parts = processedHtml.split(splitRegex);

        const paragraphs = [];
        let currentSegments = [];
        let activeStyles = { bold: false, italic: false };
        let isOrderedList = false;
        let listIndex = 1;

        parts.forEach(part => {
            if (!part) return;

            const lowerPart = part.toLowerCase();

            // Handle block start tags
            if (lowerPart.startsWith('<') && !lowerPart.startsWith('</')) {
                if (lowerPart.startsWith('<ol')) isOrderedList = true;
                if (lowerPart.startsWith('<ul')) isOrderedList = false;

                if (lowerPart.startsWith('<li')) {
                    const prefix = isOrderedList ? `${listIndex++}. ` : "• ";
                    currentSegments.push({ text: prefix, ...activeStyles });
                }
                return;
            }

            // Handle block end tags
            if (lowerPart.startsWith('</')) {
                if (lowerPart.startsWith('</ol') || lowerPart.startsWith('</ul')) {
                    listIndex = 1;
                }
                if (currentSegments.length > 0) {
                    paragraphs.push(currentSegments);
                    currentSegments = [];
                }
                return;
            }

            // Handle inline tags and text
            const inlineParts = part.split(/(<[^>]+>)/g);
            inlineParts.forEach(seg => {
                if (!seg) return;
                const lowerSeg = seg.toLowerCase();

                if (lowerSeg.startsWith('<b') || lowerSeg.startsWith('<strong')) {
                    activeStyles.bold = true;
                } else if (lowerSeg.startsWith('</b') || lowerSeg.startsWith('</strong')) {
                    activeStyles.bold = false;
                } else if (lowerSeg.startsWith('<i') || lowerSeg.startsWith('<em')) {
                    activeStyles.italic = true;
                } else if (lowerSeg.startsWith('</i') || lowerSeg.startsWith('</em')) {
                    activeStyles.italic = false;
                } else if (!seg.startsWith('<')) {
                    // It's text
                    const cleanText = seg
                        .replace(/&nbsp;/g, " ")
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"');
                    if (cleanText) {
                        currentSegments.push({ text: cleanText, ...activeStyles });
                    }
                }
            });
        });

        // Residual segments
        if (currentSegments.length > 0) {
            paragraphs.push(currentSegments);
        }

        return paragraphs;
    };

    /**
     * Renders rich text (segments) line by line with page break support
     */
    const renderRichText = (html, x, y, maxWidth) => {
        const paragraphs = parseHtmlForPdf(html);
        let currentY = y;

        paragraphs.forEach(segments => {
            // First, calculate lines for this paragraph
            // We need to group segments into lines based on maxWidth
            let lines = [[]];
            let currentLineWidth = 0;

            segments.forEach(seg => {
                const words = seg.text.split(/(\s+)/);
                words.forEach(word => {
                    const fontStyle = (seg.bold && seg.italic) ? "bolditalic" : (seg.bold ? "bold" : (seg.italic ? "italic" : "normal"));
                    doc.setFont("helvetica", fontStyle);
                    doc.setFontSize(10);

                    const wordWidth = doc.getTextWidth(word);

                    if (currentLineWidth + wordWidth > maxWidth && currentLineWidth > 0) {
                        // Start new line
                        lines.push([]);
                        currentLineWidth = 0;
                        // Avoid leading spaces on new lines
                        if (word.trim() === "") return;
                    }

                    lines[lines.length - 1].push({ text: word, style: fontStyle });
                    currentLineWidth += wordWidth;
                });
            });

            // Draw lines
            lines.forEach(line => {
                // Page break check
                if (currentY > pageHeight - 25) {
                    doc.addPage();
                    drawHeader(doc);
                    currentY = 40;
                }

                let currentX = x;
                line.forEach(item => {
                    doc.setFont("helvetica", item.style);
                    doc.text(item.text, currentX, currentY);
                    currentX += doc.getTextWidth(item.text);
                });
                currentY += 6; // Line height
            });

            currentY += 2; // Paragraph spacing
        });

        return currentY;
    };

    const stripHtml = (html) => {
        if (!html) return "";
        let text = html.replace(/<(?:div|p|br)[^>]*>/gi, "\n");
        const listRegex = /<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
        text = text.replace(listRegex, (match, type, content) => {
            const isOrdered = type.toLowerCase() === 'ol';
            let itemCount = 1;
            return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (liMatch, liContent) => {
                const prefix = isOrdered ? `${itemCount++}. ` : "• ";
                return `\n${prefix}${liContent}`;
            });
        });
        return text
            .replace(/<[^>]*>?/gm, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .trim();
    };

    // --- Asset Loading ---
    const clientLogoImg = await loadImage(logo);
    const sustLogoImg = await loadImage(window.location.origin + "/sustenergy_logo.png");
    const sigImg = await loadImage(signature);

    // --- Header Rendering Function ---
    const drawHeader = (docObject) => {
        const logoSize = 25; // Base square height/width box
        const headerY = 10;

        // Left Logo
        if (clientLogoImg) {
            const ratio = clientLogoImg.width / clientLogoImg.height;
            let w = logoSize, h = logoSize;
            if (ratio > 1) h = logoSize / ratio;
            else w = logoSize * ratio;

            // Vertical centering within the logoSize height
            const yPos = headerY + (logoSize - h) / 2;
            docObject.addImage(clientLogoImg, "PNG", margin, yPos, w, h, undefined, 'FAST');
        }

        // Right Logo
        if (sustLogoImg) {
            const ratio = sustLogoImg.width / sustLogoImg.height;
            let w = logoSize, h = logoSize;
            if (ratio > 1) h = logoSize / ratio;
            else w = logoSize * ratio;

            // Vertical centering within the logoSize height
            const yPos = headerY + (logoSize - h) / 2;
            docObject.addImage(sustLogoImg, "PNG", pageWidth - margin - w, yPos, w, h, undefined, 'FAST');
        }
    };

    // --- Footer Rendering Function ---
    const drawFooter = (docObject) => {
        const footerY = pageHeight - 10;
        const pageNum = docObject.internal.getNumberOfPages();

        docObject.setFontSize(9);
        docObject.setFont("helvetica", "normal");
        docObject.setTextColor(100, 100, 100);

        // Left: Document name
        docObject.text("Electrical Safety Audit Report", margin, footerY);

        // Right: Page number
        docObject.text(`Page ${pageNum}`, pageWidth - margin, footerY, { align: "right" });

        // Reset text color
        docObject.setTextColor(0, 0, 0);
    };

    // --- Document Construction ---

    // Page 1: Title & Details
    drawHeader(doc);

    let currentY = 40;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ELECTRICAL SAFETY AUDIT REPORT", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;

    doc.setFontSize(12);
    doc.text(`BRANCH: ${branchName || "-"}`, pageWidth / 2, currentY, { align: "center" });
    currentY += 7;
    doc.text(`BRANCH CODE: ${branchCode || "-"}`, pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    // Audit Details Table
    autoTable(doc, {
        startY: currentY,
        head: [],
        body: [
            [{ content: "Reference no", styles: { fontStyle: 'bold', fillColor: [217, 226, 243] } }, refNo || "-"],
            [{ content: "Dated", styles: { fontStyle: 'bold' } }, date || "-"],
            [{ content: "Inspection date", styles: { fontStyle: 'bold', fillColor: [217, 226, 243] } }, inspectionDate || "-"],
            [{ content: "Client", styles: { fontStyle: 'bold' } }, client || "-"],
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 'auto' } }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // TOC (Simplified - without page numbers)
    addText("Table of Contents", pageWidth / 2, currentY, 14, "center", "bold");
    currentY += 10;

    // TOC Data (Page No column present but values left empty as they depend on content)
    const tocData = [
        ["1", "Audit - General observations", "-"],
        ["2", "Major Highlights", "-"],
        ["3", "Snapshots of electrical installation", "-"],
        ["4", "Power parameters", "-"],
        ["5", "Connected load detail", "-"],
        ["6", "Conclusions", "-"],
    ];

    autoTable(doc, {
        startY: currentY,
        head: [["Sl. No", "Description", "Page No"]],
        body: tocData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: {
            fillColor: [45, 212, 191], // Teal color #2DD4BF
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25, halign: 'center' }
        }
    });

    // Content Pages Start
    doc.addPage();
    drawHeader(doc);
    currentY = 40;

    // 1. General Observations
    addText("1.0 Audit - General observations", margin, currentY, 12, "left", "bold");
    currentY += 10;

    if (generalObservations && generalObservations.length > 0) {
        generalObservations.forEach((observation) => {
            if (observation && observation.trim() !== "") {
                currentY = renderRichText(observation, margin, currentY, pageWidth - (2 * margin));
                currentY += 5;
            }
        });
    } else {
        addText("No observations.", margin, currentY, 10, "left", "normal");
        currentY += 10;
    }

    // 2. Major Highlights
    if (currentY > pageHeight - 30) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }
    addText("2.0 Major Highlights", margin, currentY, 12, "left", "bold");
    currentY += 10;

    if (majorHighlights && majorHighlights.length > 0) {
        majorHighlights.forEach((highlight) => {
            if (highlight && highlight.trim() !== "") {
                currentY = renderRichText(highlight, margin, currentY, pageWidth - (2 * margin));
                currentY += 5;
            }
        });
    } else {
        addText("No major highlights.", margin, currentY, 10, "left", "normal");
        currentY += 10;
    }

    // 3. Snapshots
    if (currentY > pageHeight - 30) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }
    addText("3.0 Snapshots of Electrical Installation", margin, currentY, 12, "left", "bold");
    currentY += 10;

    // We will build a body for the snapshot table. Images need to be handled carefully in autoTable.
    // autoTable supports 'didDrawCell' hook to draw images.

    const snapshotBody = [];
    let slNo = 1;

    // Flatten snapshots into rows
    // Format: Sl No | Image | Description

    snapshots.forEach(group => {
        const cleanDesc = stripHtml(group.description || "");
        if (!group.images || group.images.length === 0) {
            snapshotBody.push([slNo, "", cleanDesc]);
            slNo++;
        } else {
            group.images.forEach((imgUrl, idx) => {
                snapshotBody.push([
                    idx === 0 ? slNo : "",
                    { image: imgUrl, width: 60, height: 40 },
                    idx === 0 ? cleanDesc : ""
                ]);
            });
            slNo++;
        }
    });

    // We need to pre-load snapshot images for the table
    // Actually, loadImage is async. We should probably load them all first.
    // Or we can assume they are data URLs (from page.js which forced resizing).
    // If they are URLs, we need to load them. page.js sets snapshots as Base64 DataURLs! 
    // So we can use them directly.

    autoTable(doc, {
        startY: currentY,
        head: [["Sl. No", "Image", "Description"]],
        body: snapshotBody,
        theme: 'grid',
        headStyles: {
            fillColor: [139, 92, 246], // Purple #8B5CF6 to match title
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 70, minCellHeight: 45 }, // Ensure height for image
            2: { cellWidth: 'auto' }
        },
        didDrawCell: (data) => {
            if (data.column.index === 1 && data.cell.raw && typeof data.cell.raw === 'object') {
                const imgInfo = data.cell.raw;
                if (imgInfo.image) {
                    // Draw image in cell
                    const dim = data.cell.styles.minCellHeight || 40;
                    // Fit image
                    doc.addImage(imgInfo.image, 'JPEG', data.cell.x + 5, data.cell.y + 2, 60, 40);
                }
            }
        },
        didDrawPage: (data) => {
            drawHeader(doc);
        },
        margin: { top: 35 } // Leave space for header
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // 4. Power Parameters
    // Check if space is sufficient, else add page
    if (currentY > pageHeight - 50) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }

    addText("4.0 Power Parameters", margin, currentY, 12, "left", "bold");
    currentY += 7;

    const pp = powerParameters;
    const remarks = pp.remarks || {};
    const ppBody = [
        ["Line Voltage", "RY", pp.lineVoltage.ry ? `${pp.lineVoltage.ry} V` : "", remarks.ry || ""],
        ["", "YB", pp.lineVoltage.yb ? `${pp.lineVoltage.yb} V` : "", remarks.yb || ""],
        ["", "BR", pp.lineVoltage.br ? `${pp.lineVoltage.br} V` : "", remarks.br || ""],
        ["Phase Voltage", "R-N", pp.phaseVoltage.rn ? `${pp.phaseVoltage.rn} V` : "", remarks.rn || ""],
        ["", "Y-N", pp.phaseVoltage.yn ? `${pp.phaseVoltage.yn} V` : "", remarks.yn || ""],
        ["", "B-N", pp.phaseVoltage.bn ? `${pp.phaseVoltage.bn} V` : "", remarks.bn || ""],
        ["Neutral to Earth", "N-E", pp.neutralEarth.ne || "", remarks.ne || ""],
        ["Current", "R", pp.current.r ? `${pp.current.r} A` : "", remarks.r || ""],
        ["", "Y", pp.current.y ? `${pp.current.y} A` : "", remarks.y || ""],
        ["", "B", pp.current.b ? `${pp.current.b} A` : "", remarks.b || ""],
        ["", "N", pp.current.n ? `${pp.current.n} A` : "", remarks.n || ""],
        ["Frequency", "", pp.frequency ? `${pp.frequency} Hz` : "", remarks.frequency || ""],
        ["Power Factor", "", pp.powerFactor || "", remarks.powerFactor || ""]
    ];

    autoTable(doc, {
        startY: currentY,
        head: [["Parameter", "Test Point", "Value", "Remarks"]],
        body: ppBody,
        theme: 'grid',
        headStyles: {
            fillColor: [245, 158, 11], // Orange #F59E0B to match title
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        didDrawPage: (data) => { drawHeader(doc); },
        margin: { top: 35 }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // 5. Connected Load
    if (currentY > pageHeight - 50) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }

    addText("5.0 Connected Load Detail", margin, currentY, 12, "left", "bold");
    currentY += 7;

    const loadBody = connectedLoad.map((l, i) => [i + 1, l.type, l.power, l.qty, l.subTotal]);
    const totalLoad = connectedLoad.reduce((acc, curr) => acc + (parseFloat(curr.subTotal) || 0), 0);
    loadBody.push(["", "Connected load in KW", "", "", totalLoad.toFixed(2)]);

    autoTable(doc, {
        startY: currentY,
        head: [["Sl. No", "Type of Load", "Power (W)", "Qty", "Sub Total (KW)"]],
        body: loadBody,
        theme: 'grid',
        headStyles: {
            fillColor: [239, 68, 68], // Red #EF4444 to match title
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        didDrawPage: (data) => { drawHeader(doc); },
        margin: { top: 35 }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // 6. Conclusions
    if (currentY > pageHeight - 50) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }

    addText("6.0 Conclusions", margin, currentY, 12, "left", "bold");
    currentY += 10;

    if (conclusions && conclusions.length > 0) {
        conclusions.forEach(conclusion => {
            if (conclusion && conclusion.trim() !== "") {
                currentY = renderRichText(conclusion, margin, currentY, pageWidth - (2 * margin));
                currentY += 5;
            }
        });
    } else {
        addText("No conclusions.", margin, currentY, 10, "left", "normal");
        currentY += 10;
    }

    currentY += 20;

    // Footer / Signatory
    if (currentY + 60 > pageHeight - 20) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }

    doc.setFont("helvetica", "bold");
    doc.text("For Sustenergy Foundation", margin, currentY);
    currentY += 10;

    if (sigImg) {
        // Keep aspect ratio roughly
        const sigW = 50;
        const sigH = (sigImg.height / sigImg.width) * sigW;
        doc.addImage(sigImg, 'PNG', margin, currentY, sigW, sigH);
        currentY += sigH + 5;
    } else {
        currentY += 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Jayakumar.R", margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.text("Principal Consultant.", margin, currentY);
    currentY += 5;
    doc.text("Certified Energy Manager – EM 0514 – Bureau of Energy efficiency, India", margin, currentY);
    currentY += 5;
    doc.text("Supervisor Grade A – SA 1387- All LT/MV/HT Electrical Installation, KSELB, Kerala State", margin, currentY);
    currentY += 5;
    doc.text("Certified Infrared Thermographer Level 1 – No 2017IN08N002 - Infrared Training Center, Sweden", margin, currentY);

    // ========== ORGANIZATION FOOTER ==========
    currentY += 20;

    // Check if we need a new page for organization footer
    if (currentY + 50 > pageHeight - 20) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81); // Gray text color

    // Reg. office line
    doc.setFont("helvetica", "bold");
    doc.text("Reg. office: - ", margin, currentY);
    const regOfficeWidth = doc.getTextWidth("Reg. office: - ");
    doc.setFont("helvetica", "normal");
    doc.text("Mathuvala, Kudamaloor.P.O, Kottayam -17, Kerala state, India Ph:- +91 481 6454636 , +91 9020093636", margin + regOfficeWidth, currentY);
    currentY += 5;

    // Marketing Office line
    doc.setFont("helvetica", "bold");
    doc.text("Marketing Office :- ", margin, currentY);
    const marketingWidth = doc.getTextWidth("Marketing Office :- ");
    doc.setFont("helvetica", "normal");
    doc.text("277 N Pathinaruparayil Arcade, Chalukunnu, Kottayam.P.O, Kerala State 686 001", margin + marketingWidth, currentY);
    currentY += 5;

    // Email and Website line
    doc.setFont("helvetica", "normal");
    doc.text("Email:- contact@sustenergyfoundation.org   ", margin, currentY);
    const emailTextWidth = doc.getTextWidth("Email:- contact@sustenergyfoundation.org   ");
    doc.text("website:- ", margin + emailTextWidth, currentY);
    const websiteLabelWidth = doc.getTextWidth("website:- ");
    doc.setTextColor(0, 0, 255); // Blue for URL
    doc.text("www.sustenergyfoundation.org", margin + emailTextWidth + websiteLabelWidth, currentY);
    currentY += 10;

    // Countries line with yellow background
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    const countries = ["India", "Maldives", "Sri Lanka", "Nepal", "UAE"];
    const countrySpacing = 30;
    let countryX = margin;

    // Calculate total width for countries
    let totalCountryWidth = 0;
    countries.forEach((country, idx) => {
        totalCountryWidth += doc.getTextWidth(country);
        if (idx < countries.length - 1) totalCountryWidth += countrySpacing;
    });

    // Draw yellow background rectangle
    doc.setFillColor(255, 255, 0); // Yellow
    doc.rect(margin - 2, currentY - 5, totalCountryWidth + 4, 8, 'F');

    // Draw country names
    countries.forEach((country, idx) => {
        doc.text(country, countryX, currentY);
        countryX += doc.getTextWidth(country) + countrySpacing;
    });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // --- Draw footers on all pages ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const footerY = pageHeight - 10;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);

        // Left: Document name
        doc.text("Electrical Safety Audit Report", margin, footerY);

        // Center: separator
        doc.text("|", pageWidth / 2, footerY, { align: "center" });

        // Right: Page number
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });

        // Reset text color
        doc.setTextColor(0, 0, 0);
    }

    // Save
    const safeBranchName = (branchName || "Draft").replace(/[^a-z0-9\s-_]/gi, '').trim().replace(/\s+/g, '_');
    doc.save(`Audit_Report_${safeBranchName}.pdf`);
};
