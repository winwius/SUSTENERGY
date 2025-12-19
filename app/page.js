"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Download, Camera, FileText, Zap, Activity, CheckCircle, PenTool, Upload, X, ChevronDown, ChevronUp, Images, FileType } from "lucide-react";
import { generateDocx } from "./utils/generateDocx";
import { generatePdf } from "./utils/generatePdf";

function CollapsibleCard({ title, icon: Icon, theme, children, headerContent, bodyClassName = "card-body" }) {
    const [isOpen, setIsOpen] = useState(true);

    // Helper to allow actions to force-expand the card
    const expandCard = (e) => {
        if (e) e.stopPropagation(); // Prevent the main toggle from firing (which might close it)
        setIsOpen(true);
    };

    return (
        <section className={`colorful-card theme-${theme}`}>
            <div
                className="card-header relative flex flex-col md:flex-row md:items-center justify-between cursor-pointer select-none pb-12 md:pb-6"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                    <Icon size={24} />
                    <h2 className="text-xl">{title}</h2>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                    {/* Render headerContent, passing expandCard if it's a function */}
                    {typeof headerContent === 'function'
                        ? headerContent({ expand: expandCard })
                        : headerContent}
                </div>

                <div className="absolute bottom-2 right-4 p-2 rounded-full hover:bg-black/10 transition-colors text-white/80 hover:text-white">
                    {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </div>
            {isOpen && (
                <div className={bodyClassName}>
                    {children}
                </div>
            )}
        </section>
    );
}

export default function Home() {
    const [formData, setFormData] = useState({
        branchName: "",
        branchCode: "",
        refNo: "",
        date: "",
        inspectionDate: "",
        client: "",
        createdBy: "",
        approvedBy: "",
        generalObservations: "",
        snapshots: [],
        powerParameters: {
            lineVoltage: { ry: "", yb: "", br: "" },
            phaseVoltage: { rn: "", yn: "", bn: "" },
            neutralEarth: { ne: "" },
            current: { r: "", y: "", b: "", n: "" },
            frequency: "50Hz",
            powerFactor: "",
        },
        connectedLoad: [],
        conclusions: [""],
        majorHighlights: [""],
        signature: null,
        useDefaultSignature: true,
        logo: null,
    });

    const handleInputChange = (e, section, field, subField) => {
        const value = e.target.value;
        setFormData((prev) => {
            if (section) {
                if (subField) {
                    return {
                        ...prev,
                        [section]: {
                            ...prev[section],
                            [field]: {
                                ...prev[section][field],
                                [subField]: value,
                            },
                        },
                    };
                }
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: value,
                    },
                };
            }
            return { ...prev, [field]: value };
        });
    };

    // Helper: Resize image before storing
    const resizeImage = (file, mimeType = 'image/jpeg', quality = 0.8) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1000;
                    const MAX_HEIGHT = 1000;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL(mimeType, quality));
                };
            };
        });
    };

    // Snapshots
    const addSnapshot = () => {
        setFormData((prev) => ({
            ...prev,
            snapshots: [...prev.snapshots, { images: [], description: "" }],
        }));
    };

    const removeSnapshot = (index) => {
        setFormData((prev) => ({
            ...prev,
            snapshots: prev.snapshots.filter((_, i) => i !== index),
        }));
    };

    // Header/Footer "Add Photo" -> Creates a NEW GROUP with all selected images
    const handleMultiFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const newImages = [];
        for (const file of files) {
            if (file.size <= 20 * 1024 * 1024) {
                const img = await resizeImage(file, 'image/jpeg', 0.8);
                newImages.push(img);
            }
        }

        // Create ONE new group for this batch of uploads
        setFormData((prev) => ({
            ...prev,
            snapshots: [
                ...prev.snapshots,
                { images: newImages, description: "" }
            ]
        }));

        e.target.value = '';
    };

    // Add MORE photos to an EXISTING group
    const handleAddPhotosToGroup = async (e, groupIndex) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const newImages = [];
        for (const file of files) {
            if (file.size <= 20 * 1024 * 1024) {
                const img = await resizeImage(file, 'image/jpeg', 0.8);
                newImages.push(img);
            }
        }

        setFormData((prev) => {
            const newSnapshots = [...prev.snapshots];
            newSnapshots[groupIndex].images = [...newSnapshots[groupIndex].images, ...newImages];
            return { ...prev, snapshots: newSnapshots };
        });
        e.target.value = '';
    };

    const removeImageFromGroup = (groupIndex, imageIndex) => {
        setFormData((prev) => {
            const newSnapshots = [...prev.snapshots];
            newSnapshots[groupIndex].images = newSnapshots[groupIndex].images.filter((_, i) => i !== imageIndex);
            return { ...prev, snapshots: newSnapshots };
        });
    };

    const handleSnapshotDescChange = (value, index) => {
        setFormData((prev) => {
            const newSnapshots = [...prev.snapshots];
            newSnapshots[index].description = value;
            return { ...prev, snapshots: newSnapshots };
        });
    };

    // ... (rest of the file until return)

    /* Inside the render return, replace the Snapshots CollapsibleCard block */
    // Since I cannot match "... (rest of the file)" in 'TargetContent' easily, I will target the functions and the specific CollapsibleCard block.
    // However, the tool requires contiguous blocks. I will split this into two edits if needed, or target the range from 'const resizeImage' (which doesn't exist yet)
    // Wait, the functions 'addSnapshot' etc exist. I will replace the whole block of Snapshot Logic + The Snapshots Card.
    // Let's verify line numbers.
    // 'addSnapshot' starts line 101.
    // 'CollapsibleCard' for snapshots starts line 293 and ends 369.
    // I will replace lines 101-140 (Handlers) AND lines 293-369 (JSX) separately?
    // No, I can only do contiguous. The handlers are separated from JSX by 'Logo Upload' etc.
    // I must use 'multi_replace_file_content'.

    /* REDO STRATEGY */
    /* I will use the 'multi_replace_file_content' tool. */


    // Logo Upload
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) { // 20 MB Check
                alert("File size exceeds 20MB limit.");
                return;
            }
            // Use resizeImage to normalize to PNG (preserves transparency)
            const logoData = await resizeImage(file, 'image/png', 1.0);
            setFormData((prev) => ({ ...prev, logo: logoData }));
        }
    };

    // Connected Load
    const addLoad = () => {
        setFormData((prev) => ({
            ...prev,
            connectedLoad: [...prev.connectedLoad, { type: "", power: "", qty: "", subTotal: "" }],
        }));
    };

    const removeLoad = (index) => {
        setFormData((prev) => ({
            ...prev,
            connectedLoad: prev.connectedLoad.filter((_, i) => i !== index),
        }));
    };

    const handleLoadChange = (index, field, value) => {
        setFormData((prev) => {
            const newLoads = [...prev.connectedLoad];
            newLoads[index][field] = value;
            // Auto calc subtotal
            if (field === "power" || field === "qty") {
                const power = parseFloat(field === "power" ? value : newLoads[index].power) || 0;
                const qty = parseFloat(field === "qty" ? value : newLoads[index].qty) || 0;
                newLoads[index].subTotal = ((power * qty) / 1000).toFixed(3); // KW
            }
            return { ...prev, connectedLoad: newLoads };
        });
    };

    // Conclusions
    const addConclusion = () => {
        setFormData((prev) => ({
            ...prev,
            conclusions: [...prev.conclusions, ""],
        }));
    };

    const removeConclusion = (index) => {
        setFormData((prev) => ({
            ...prev,
            conclusions: prev.conclusions.filter((_, i) => i !== index),
        }));
    };

    const handleConclusionChange = (value, index) => {
        setFormData((prev) => {
            const newConclusions = [...prev.conclusions];
            newConclusions[index] = value;
            return { ...prev, conclusions: newConclusions };
        });
    };

    // Major Highlights
    const addHighlight = () => {
        setFormData((prev) => ({
            ...prev,
            majorHighlights: [...prev.majorHighlights, ""],
        }));
    };

    const removeHighlight = (index) => {
        setFormData((prev) => ({
            ...prev,
            majorHighlights: prev.majorHighlights.filter((_, i) => i !== index),
        }));
    };

    const handleHighlightChange = (value, index) => {
        setFormData((prev) => {
            const newHighlights = [...prev.majorHighlights];
            newHighlights[index] = value;
            return { ...prev, majorHighlights: newHighlights };
        });
    };

    const handlePowerParamChange = (field, subField, value) => {
        setFormData((prev) => {
            const newPowerParams = { ...prev.powerParameters };

            if (subField) {
                newPowerParams[field] = { ...newPowerParams[field], [subField]: value };
            } else {
                newPowerParams[field] = value;
            }

            // Auto-calculate Line Voltage if Phase Voltage changes
            if (field === "phaseVoltage") {
                const phaseVal = parseFloat(value);
                const lineSubField = subField === "rn" ? "ry" : (subField === "yn" ? "yb" : "br");

                if (!isNaN(phaseVal) && value.trim() !== "") {
                    // Calculation rounded to 3 decimal places
                    const lineVal = (phaseVal * Math.sqrt(3)).toFixed(3);
                    newPowerParams.lineVoltage = { ...newPowerParams.lineVoltage, [lineSubField]: lineVal };
                } else {
                    // Clear the value if the input is empty to let the placeholder reappear
                    newPowerParams.lineVoltage = { ...newPowerParams.lineVoltage, [lineSubField]: "" };
                }
            }

            return { ...prev, powerParameters: newPowerParams };
        });
    };

    return (
        <main className="min-h-screen p-6 md:p-12 lg:p-16 pb-32 max-w-4xl mx-auto">
            <header className="mb-12 text-center pt-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-800">
                    Electrical Safety Audit
                </h1>
                <p className="text-slate-500 text-lg">
                    Generate professional audit reports
                </p>
            </header>

            <div className="space-y-8">
                {/* 1. General Info - Blue Theme */}
                {/* 1. General Info - Blue Theme */}
                <CollapsibleCard title="General Information" icon={FileText} theme="blue">
                    <div className="mb-6 flex flex-col items-center gap-4">
                        {formData.logo && (
                            <div
                                className="relative bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shadow-sm"
                                style={{ width: '80px', height: '64px', minWidth: '80px' }}
                            >
                                <img
                                    src={formData.logo}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                        )}
                        <div className="flex flex-col items-center gap-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                <Camera size={20} />
                                Upload Client Logo
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="file-input"
                                onChange={handleLogoUpload}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Branch Name</label>
                            <input placeholder="e.g. Downtown Branch" className="input-field" value={formData.branchName} onChange={(e) => handleInputChange(e, null, "branchName")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Branch Code</label>
                            <input placeholder="e.g. BR001" className="input-field" value={formData.branchCode} onChange={(e) => handleInputChange(e, null, "branchCode")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Reference No</label>
                            <input placeholder="e.g. REF-2024-001" className="input-field" value={formData.refNo} onChange={(e) => handleInputChange(e, null, "refNo")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Report Date</label>
                            <input type="date" className="input-field" value={formData.date} onChange={(e) => handleInputChange(e, null, "date")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Inspection Date</label>
                            <input type="date" className="input-field" value={formData.inspectionDate} onChange={(e) => handleInputChange(e, null, "inspectionDate")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Client Name</label>
                            <input placeholder="e.g. Acme Corp" className="input-field" value={formData.client} onChange={(e) => handleInputChange(e, null, "client")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Created By</label>
                            <input placeholder="e.g. John Doe" className="input-field" value={formData.createdBy} onChange={(e) => handleInputChange(e, null, "createdBy")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Approved By</label>
                            <input placeholder="e.g. Jane Smith" className="input-field" value={formData.approvedBy} onChange={(e) => handleInputChange(e, null, "approvedBy")} />
                        </div>
                    </div>
                </CollapsibleCard>

                {/* 2. Observations - Green Theme */}
                {/* 2. Observations - Green Theme */}
                <CollapsibleCard title="General Observations" icon={Activity} theme="green">
                    <textarea
                        placeholder="Enter detailed observations about the electrical installation..."
                        className="input-field min-h-[150px] resize-y"
                        value={formData.generalObservations}
                        onChange={(e) => handleInputChange(e, null, "generalObservations")}
                    />
                </CollapsibleCard>

                {/* Major Highlights - Yellow/Amber Theme */}
                <CollapsibleCard
                    title="Major Highlights"
                    icon={Zap}
                    theme="orange"
                    bodyClassName="card-body space-y-4"
                    headerContent={({ expand }) =>
                        formData.majorHighlights.length === 0 && (
                            <button
                                onClick={(e) => {
                                    expand(e);
                                    addHighlight();
                                }}
                                className="btn-add flex items-center gap-2"
                            >
                                <Plus size={16} /> Add First Highlight
                            </button>
                        )
                    }
                >
                    {formData.majorHighlights.map((highlight, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <span className="text-orange-500 pt-3 text-lg">•</span>
                            <textarea
                                className="input-field min-h-[60px] resize-y"
                                value={highlight}
                                onChange={(e) => handleHighlightChange(e.target.value, index)}
                                placeholder="Enter a major highlight..."
                            />
                            <button onClick={() => removeHighlight(index)} className="text-slate-400 hover:text-red-500 p-3 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {formData.majorHighlights.length > 0 && (
                        <div className="flex justify-center pt-4">
                            <button onClick={addHighlight} className="btn-add flex items-center gap-2 w-full md:w-auto justify-center">
                                <Plus size={16} /> Add Another Highlight
                            </button>
                        </div>
                    )}
                </CollapsibleCard>

                {/* 3. Snapshots - Purple Theme */}
                {/* 3. Snapshots - Purple Theme */}
                <CollapsibleCard
                    title="Snapshots"
                    icon={Camera}
                    theme="purple"
                    bodyClassName="card-body bg-slate-50/50 space-y-6"
                >
                    <div className="space-y-8">
                        {formData.snapshots.map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative group-card">
                                {/* Group Actions (Add Photo & Delete) */}
                                <div className="flex items-center gap-3 mb-3 justify-end">
                                    <label
                                        className="btn-add flex items-center gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-semibold"
                                        title="Add Photos to this group"
                                    >
                                        <Plus size={16} /> Add Photos
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleAddPhotosToGroup(e, groupIndex)}
                                        />
                                    </label>

                                    <button
                                        onClick={() => removeSnapshot(groupIndex)}
                                        className="btn-add flex items-center gap-2 bg-purple-50 text-purple-600 hover:bg-red-50 hover:text-red-600 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold"
                                        title="Delete Entire Group"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Description - Prominent at Top for the Group */}
                                    <div>
                                        <textarea
                                            placeholder="Describe the observations for this set of photos..."
                                            className="input-field min-h-[100px] resize-y text-sm"
                                            value={group.description}
                                            onChange={(e) => handleSnapshotDescChange(e.target.value, groupIndex)}
                                        />
                                    </div>

                                    {/* Image Grid */}
                                    <div>
                                        <div className="flex flex-wrap gap-3">
                                            {group.images.map((img, imgIndex) => (
                                                <div
                                                    key={imgIndex}
                                                    className="relative bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm"
                                                    style={{ width: '80px', height: '64px', minWidth: '80px' }}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`Snapshot ${imgIndex + 1} `}
                                                        className="w-full h-full object-contain rounded-lg"
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                    {/* Individual Image Delete Badge */}
                                                    <button
                                                        onClick={() => removeImageFromGroup(groupIndex, imgIndex)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-red-600 transition-all z-10"
                                                        title="Remove Image"
                                                    >
                                                        <X size={12} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Always visible Add Placeholder at the end */}

                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                        }

                        {/* Empty State */}
                        {
                            formData.snapshots.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
                                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Camera className="text-purple-400" size={32} />
                                    </div>
                                    <h3 className="text-slate-700 font-semibold mb-6">No Observations Added</h3>
                                    <label className="btn-add flex items-center gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 px-6 py-2 cursor-pointer shadow-sm mx-auto">
                                        <Plus size={18} /> Add First Observation
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            style={{ display: 'none' }}
                                            onChange={handleMultiFileUpload}
                                        />
                                    </label>
                                </div>
                            )
                        }

                        {/* Footer Action */}
                        {
                            formData.snapshots.length > 0 && (
                                <div className="mt-4 flex justify-start">
                                    <label className="btn-add w-full md:w-auto py-3 md:py-2 flex items-center justify-center gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 cursor-pointer">
                                        <Plus size={18} /> Add another observation
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            style={{ display: 'none' }}
                                            onChange={handleMultiFileUpload}
                                        />
                                    </label>
                                </div>
                            )
                        }
                    </div >
                </CollapsibleCard >

                {/* 4. Power Parameters - Orange Theme */}
                {/* 4. Power Parameters - Orange Theme */}
                <CollapsibleCard title="Power Parameters" icon={Zap} theme="orange" bodyClassName="card-body overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr>
                                <th className="w-1/4">Parameter</th>
                                <th className="w-1/6">Test Point</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            {/* Line Voltage */}
                            <tr>
                                <td rowSpan={3} className="font-semibold text-slate-700 bg-slate-50">
                                    Line Voltage
                                </td>
                                <td className="font-medium text-slate-500">RY</td>
                                <td><input className="input-field py-2 bg-slate-50 text-slate-500" value={formData.powerParameters.lineVoltage.ry} readOnly placeholder="R-N * √3" /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">YB</td>
                                <td><input className="input-field py-2 bg-slate-50 text-slate-500" value={formData.powerParameters.lineVoltage.yb} readOnly placeholder="Y-N * √3" /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">BR</td>
                                <td><input className="input-field py-2 bg-slate-50 text-slate-500" value={formData.powerParameters.lineVoltage.br} readOnly placeholder="B-N * √3" /></td>
                            </tr>
                            {/* Phase Voltage */}
                            <tr>
                                <td rowSpan={3} className="font-semibold text-slate-700 bg-slate-50">Phase Voltage</td>
                                <td className="font-medium text-slate-500">R-N</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.phaseVoltage.rn} onChange={(e) => handlePowerParamChange("phaseVoltage", "rn", e.target.value)} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">Y-N</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.phaseVoltage.yn} onChange={(e) => handlePowerParamChange("phaseVoltage", "yn", e.target.value)} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">B-N</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.phaseVoltage.bn} onChange={(e) => handlePowerParamChange("phaseVoltage", "bn", e.target.value)} /></td>
                            </tr>
                            {/* Neutral to Earth */}
                            <tr>
                                <td className="font-semibold text-slate-700 bg-slate-50">Neutral to Earth</td>
                                <td className="font-medium text-slate-500">N-E</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.neutralEarth.ne} onChange={(e) => handlePowerParamChange("neutralEarth", "ne", e.target.value)} /></td>
                            </tr>
                            {/* Current */}
                            <tr>
                                <td rowSpan={4} className="font-semibold text-slate-700 bg-slate-50">Current</td>
                                <td className="font-medium text-slate-500">R</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.current.r} onChange={(e) => handlePowerParamChange("current", "r", e.target.value)} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">Y</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.current.y} onChange={(e) => handlePowerParamChange("current", "y", e.target.value)} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">B</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.current.b} onChange={(e) => handlePowerParamChange("current", "b", e.target.value)} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">N</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.current.n} onChange={(e) => handlePowerParamChange("current", "n", e.target.value)} /></td>
                            </tr>
                            {/* Freq & PF */}
                            <tr>
                                <td className="font-semibold text-slate-700 bg-slate-50">Frequency</td>
                                <td className="text-center text-slate-400">-</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.frequency} onChange={(e) => handlePowerParamChange("frequency", null, e.target.value)} /></td>
                            </tr>
                            <tr>
                                <td className="font-semibold text-slate-700 bg-slate-50">Power Factor</td>
                                <td className="text-center text-slate-400">-</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.powerFactor} onChange={(e) => handlePowerParamChange("powerFactor", null, e.target.value)} /></td>
                            </tr>
                        </tbody>
                    </table>
                </CollapsibleCard>

                {/* 5. Connected Load - Pink Theme */}
                {/* 5. Connected Load - Pink Theme */}
                <CollapsibleCard title="Connected Load" icon={Zap} theme="pink">
                    {formData.connectedLoad.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-slate-500 font-medium mb-4 text-lg">No Connected Load Added</p>
                            <button onClick={addLoad} className="btn-add flex items-center gap-2 bg-pink-50 text-pink-600 hover:bg-pink-100 px-6 py-2">
                                <Plus size={18} /> Add Load
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* List Items */}
                            <div className="space-y-6 md:space-y-2">
                                {formData.connectedLoad.map((load, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border border-slate-200 md:border-none relative md:static">

                                        {/* Mobile Delete */}
                                        <div className="absolute top-2 right-2 md:hidden">
                                            <button onClick={() => removeLoad(index)} className="icon-btn text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        {/* Type */}
                                        <div className="md:col-span-4 space-y-1 md:space-y-0">
                                            <label className="block md:hidden text-xs font-bold text-slate-500 uppercase">Type of Load</label>
                                            <input
                                                className="input-field py-2"
                                                value={load.type}
                                                onChange={(e) => handleLoadChange(index, "type", e.target.value)}
                                                placeholder="e.g. Light (LED)"
                                            />
                                        </div>

                                        {/* Power */}
                                        <div className="md:col-span-2 space-y-1 md:space-y-0">
                                            <label className="block md:hidden text-xs font-bold text-slate-500 uppercase">Power (W)</label>
                                            <input
                                                type="number"
                                                className="input-field py-2"
                                                value={load.power}
                                                onChange={(e) => handleLoadChange(index, "power", e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Qty */}
                                        <div className="md:col-span-2 space-y-1 md:space-y-0">
                                            <label className="block md:hidden text-xs font-bold text-slate-500 uppercase">Quantity</label>
                                            <input
                                                type="number"
                                                className="input-field py-2"
                                                value={load.qty}
                                                onChange={(e) => handleLoadChange(index, "qty", e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* SubTotal */}
                                        <div className="md:col-span-3 space-y-1 md:space-y-0">
                                            <label className="block md:hidden text-xs font-bold text-slate-500 uppercase">Sub Total (KW)</label>
                                            <input
                                                className="input-field py-2 bg-slate-100 text-slate-500 font-medium"
                                                value={load.subTotal}
                                                readOnly
                                            />
                                        </div>

                                        {/* Desktop Delete */}
                                        <div className="hidden md:block md:col-span-1 text-center">
                                            <button onClick={() => removeLoad(index)} className="icon-btn text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Totals */}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4 text-lg">
                                    <span className="font-bold text-slate-600">Total Connected Load:</span>
                                    <span className="font-bold text-2xl text-pink-600">
                                        {formData.connectedLoad.reduce((acc, curr) => acc + (parseFloat(curr.subTotal) || 0), 0).toFixed(3)} <span className="text-sm">KW</span>
                                    </span>
                                </div>

                                <button onClick={addLoad} className="btn-add w-full md:w-auto py-3 md:py-2 flex items-center justify-center gap-2 bg-pink-50 text-pink-600 hover:bg-pink-100">
                                    <Plus size={18} /> Add Another Load
                                </button>
                            </div>
                        </>
                    )}
                </CollapsibleCard>

                {/* 6. Conclusions - Teal Theme */}
                {/* 6. Conclusions - Teal Theme */}
                <CollapsibleCard
                    title="Conclusions"
                    icon={CheckCircle}
                    theme="teal"
                    bodyClassName="card-body space-y-4"
                    headerContent={({ expand }) =>
                        formData.conclusions.length === 0 && (
                            <button
                                onClick={(e) => {
                                    expand(e);
                                    addConclusion();
                                }}
                                className="btn-add flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Point
                            </button>
                        )
                    }
                >
                    {formData.conclusions.map((conc, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <span className="text-teal-500 pt-3 text-lg">•</span>
                            <textarea
                                className="input-field min-h-[60px] resize-y"
                                value={conc}
                                onChange={(e) => handleConclusionChange(e.target.value, index)}
                                placeholder="Enter conclusion point..."
                            />
                            <button onClick={() => removeConclusion(index)} className="text-slate-400 hover:text-red-500 p-3 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {formData.conclusions.length > 0 && (
                        <div className="flex justify-center pt-4">
                            <button onClick={addConclusion} className="btn-add flex items-center gap-2 w-full md:w-auto justify-center">
                                <Plus size={16} /> Add Another Point
                            </button>
                        </div>
                    )}
                </CollapsibleCard>

                {/* 7. Signature Upload - New Section */}
                {/* 7. Signature Upload - New Section */}
                <CollapsibleCard title="Signature" icon={PenTool} theme="blue">
                    <div className="flex flex-col gap-6">
                        {/* Default vs Custom Toggle */}
                        <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <input
                                type="checkbox"
                                id="useDefaultSig"
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                checked={formData.useDefaultSignature}
                                onChange={(e) => setFormData({ ...formData, useDefaultSignature: e.target.checked })}
                            />
                            <label htmlFor="useDefaultSig" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                                Use Default Signature
                            </label>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="shrink-0 flex flex-col gap-2">
                                <div
                                    className="relative bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shadow-sm"
                                    style={{ width: '120px', height: '64px', minWidth: '120px' }}
                                >
                                    {(formData.useDefaultSignature || formData.signature) ? (
                                        <img
                                            src={formData.useDefaultSignature ? "/default_signature.jpg" : formData.signature}
                                            alt="Signature"
                                            className="w-full h-full object-contain"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <div className="text-center p-2 flex flex-col items-center justify-center h-full">
                                            <PenTool className="mx-auto text-slate-300 mb-0.5" size={16} />
                                            <span className="text-slate-400 text-[9px] leading-tight block">No Sig</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 flex-1">
                                {/* Custom File Input Button */}
                                <div className="w-full">
                                    <label
                                        className={`btn-add flex items-center justify-center gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 px-6 py-2 cursor-pointer shadow-sm transition-all ${formData.useDefaultSignature
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                            }`}
                                    >
                                        <Upload size={18} />
                                        <span>Add a Custom Signature</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            style={{ display: 'none' }}
                                            disabled={formData.useDefaultSignature}
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    // Resize/Normalize to PNG for signature (transparency)
                                                    const sigData = await resizeImage(file, 'image/png', 1.0);
                                                    setFormData({ ...formData, signature: sigData });
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {!formData.useDefaultSignature && formData.signature && (
                                    <button
                                        onClick={() => setFormData({ ...formData, signature: null })}
                                        className="icon-btn text-slate-400 hover:text-red-500 transition-colors border border-slate-200 rounded-lg p-2 hover:border-red-200 hover:bg-red-50"
                                        title="Delete Signature"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </CollapsibleCard>

                {/* Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex justify-center z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                    <div className="flex gap-4">
                        <button
                            onClick={() => generateDocx({
                                ...formData,
                                signature: formData.useDefaultSignature ? window.location.origin + "/default_signature.jpg" : formData.signature
                            })}
                            className="btn-primary flex items-center gap-3"
                        >
                            <Download size={24} />
                            Generate DOCX
                        </button>
                        <button
                            onClick={() => generatePdf({
                                ...formData,
                                signature: formData.useDefaultSignature ? window.location.origin + "/default_signature.jpg" : formData.signature
                            })}
                            className="btn-pdf flex items-center gap-3"
                        >
                            <FileType size={24} />
                            Generate PDF
                        </button>
                    </div>
                </div>
            </div >
        </main >
    );
}
