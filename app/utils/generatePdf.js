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
        doc.setFontSize(size);
        doc.setFont("helvetica", weight);
        doc.text(text, x, y, { align: align });
    };

    // --- Asset Loading ---
    const clientLogoImg = await loadImage(logo);
    const sustLogoImg = await loadImage(window.location.origin + "/sustenergy_logo.png");
    const sigImg = await loadImage(signature);

    // --- Header Rendering Function ---
    const drawHeader = (docObject) => {
        const headerH = 25;
        // Left Logo
        if (clientLogoImg) {
            docObject.addImage(clientLogoImg, "PNG", margin, 10, 25, 20, undefined, 'FAST');
        }
        // Right Logo
        if (sustLogoImg) {
            docObject.addImage(sustLogoImg, "PNG", pageWidth - margin - 25, 10, 25, 20, undefined, 'FAST');
        }
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

    // TOC (Simplified)
    addText("Table of Contents", pageWidth / 2, currentY, 14, "center", "bold");
    currentY += 10;

    // TOC Data
    const tocData = [
        ["1", "Audit - General observations", "Page 2"], // Simplified Page Numbers
        ["2", "Snapshots of electrical installation", "Page 2"],
        ["3", "Power parameters", "Page 3"],
        ["4", "Connected load detail", "Page 3"],
        ["5", "Conclusions", "Page 3"],
    ];

    autoTable(doc, {
        startY: currentY,
        head: [["Sl. No", "Description"]],
        body: tocData.map(row => [row[0], row[1]]),
        theme: 'grid',
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 'auto' } }
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
    const splitObs = doc.splitTextToSize(generalObservations || "No observations.", pageWidth - (2 * margin));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(splitObs, margin, currentY);
    currentY += (splitObs.length * 5) + 10;

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
        if (!group.images || group.images.length === 0) {
            snapshotBody.push([slNo, "", group.description || ""]);
            slNo++;
        } else {
            group.images.forEach((imgUrl, idx) => {
                // We need to pass the raw image data or index to draw it later
                // Storing a custom object in the cell data
                snapshotBody.push([
                    idx === 0 ? slNo : "", // Only show SlNo for first image
                    { image: imgUrl, width: 60, height: 40 }, // Marker for image
                    idx === 0 ? (group.description || "") : "" // Only description for first
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
        const splitC = doc.splitTextToSize(`• ${c}`, pageWidth - (2 * margin));
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


    // Save
    const safeBranchName = (branchName || "Draft").replace(/[^a-z0-9\s-_]/gi, '').trim().replace(/\s+/g, '_');
    doc.save(`Audit_Report_${safeBranchName}.pdf`);
};
