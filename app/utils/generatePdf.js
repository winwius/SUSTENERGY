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
        // Strip HTML tags for PDF text
        const cleanText = (text || "").replace(/<[^>]*>?/gm, '');
        doc.setFontSize(size);
        doc.setFont("helvetica", weight);
        doc.text(cleanText, x, y, { align: align });
    };

    const stripHtml = (html) => {
        if (!html) return "";
        return html
            .replace(/<li[^>]*>/gi, "• ")
            .replace(/<(?:div|p|br)[^>]*>/gi, "\n")
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
        const logoSize = 25; // Base square size
        // Left Logo
        if (clientLogoImg) {
            const ratio = clientLogoImg.width / clientLogoImg.height;
            let w = logoSize, h = logoSize;
            if (ratio > 1) h = logoSize / ratio;
            else w = logoSize * ratio;
            docObject.addImage(clientLogoImg, "PNG", margin, 10, w, h, undefined, 'FAST');
        }
        // Right Logo
        if (sustLogoImg) {
            const ratio = sustLogoImg.width / sustLogoImg.height;
            let w = logoSize, h = logoSize;
            if (ratio > 1) h = logoSize / ratio;
            else w = logoSize * ratio;
            docObject.addImage(sustLogoImg, "PNG", pageWidth - margin - w, 10, w, h, undefined, 'FAST');
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
    // Header Hook for subsequent pages
    // Note: jsPDF doesn't automatically redraw on existing pages, but for new pages we can use a loop or just draw as we go. 
    // Since we are adding content sequentially, we can just drawHeader at the top of the new page.
    drawHeader(doc);
    currentY = 40;

    // 1. General Observations
    addText("1.0 Audit - General observations", margin, currentY, 12, "left", "bold");
    currentY += 7;

    // Wrap text for observations
    if (generalObservations && generalObservations.length > 0) {
        generalObservations.forEach((observation) => {
            if (observation && observation.trim() !== "") {
                const cleanObs = stripHtml(observation);
                const splitObs = doc.splitTextToSize(cleanObs, pageWidth - (2 * margin));

                // Add page if needed
                if (currentY + (splitObs.length * 5) > pageHeight - margin) {
                    doc.addPage();
                    drawHeader(doc);
                    currentY = 40;
                }

                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.text(splitObs, margin, currentY);
                currentY += (splitObs.length * 5) + 5;
            }
        });
        currentY += 5;
    } else {
        addText("No observations.", margin, currentY, 10, "left", "normal");
        currentY += 10;
    }

    // 2. Snapshots
    addText("2.0 Snapshots of Electrical Installation", margin, currentY, 12, "left", "bold");
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

    // 3. Power Parameters
    // Check if space is sufficient, else add page
    if (currentY > pageHeight - 50) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }

    addText("3.0 Power Parameters", margin, currentY, 12, "left", "bold");
    currentY += 7;

    const pp = powerParameters;
    const ppBody = [
        ["Line Voltage", "RY", pp.lineVoltage.ry || "", ""],
        ["", "YB", pp.lineVoltage.yb || "", ""],
        ["", "BR", pp.lineVoltage.br || "", ""],
        ["Phase Voltage", "R-N", pp.phaseVoltage.rn || "", ""],
        ["", "Y-N", pp.phaseVoltage.yn || "", ""],
        ["", "B-N", pp.phaseVoltage.bn || "", ""],
        ["Neutral to Earth", "N-E", pp.neutralEarth.ne || "", ""],
        ["Current", "R", pp.current.r || "", ""],
        ["", "Y", pp.current.y || "", ""],
        ["", "B", pp.current.b || "", ""],
        ["", "N", pp.current.n || "", ""],
        ["Frequency", "", pp.frequency || "", ""],
        ["Power Factor", "", pp.powerFactor || "", ""]
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

    // 4. Connected Load
    if (currentY > pageHeight - 50) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }

    addText("4.0 Connected Load Detail", margin, currentY, 12, "left", "bold");
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

    // 5. Conclusions
    if (currentY > pageHeight - 50) {
        doc.addPage();
        drawHeader(doc);
        currentY = 40;
    }

    addText("5.0 Conclusions", margin, currentY, 12, "left", "bold");
    currentY += 7;

    conclusions.forEach(c => {
        const cleanC = stripHtml(c);
        if (!cleanC) return;
        const splitC = doc.splitTextToSize(`• ${cleanC}`, pageWidth - (2 * margin));
        if (currentY + (splitC.length * 5) > pageHeight - 40) { // Check space
            doc.addPage();
            drawHeader(doc);
            currentY = 40;
        }
        doc.setFontSize(10);
        doc.text(splitC, margin, currentY);
        currentY += (splitC.length * 5) + 2;
    });

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
