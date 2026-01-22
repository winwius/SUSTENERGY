"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Download, Camera, FileText, Zap, Activity, CheckCircle, PenTool, Upload, X, ChevronDown, ChevronUp, Images, FileType } from "lucide-react";
import { generateDocx } from "./utils/generateDocx";
import { generatePdf } from "./utils/generatePdf";
import { DEFAULT_SIGNATURE } from "./utils/assets";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("./components/RichTextEditor"), {
    ssr: false,
    loading: () => <div className="h-[200px] bg-slate-50 animate-pulse rounded-xl border-2 border-slate-200" />
});

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

// Custom Unit Input that displays value with a unit suffix (e.g., " V" or " A") and keeps cursor before the suffix
function UnitInput({ value, onChange, unit, className = "" }) {
    const inputRef = useRef(null);
    const displayValue = value ? `${value} ${unit}` : '';
    const suffixPattern = new RegExp(` ${unit}$`, 'i');

    const handleChange = (e) => {
        // Extract only numeric value (remove unit suffix and non-numeric chars except decimal)
        const rawValue = e.target.value.replace(suffixPattern, '').replace(/[^0-9.]/g, '');
        onChange(rawValue);
    };

    const handleSelect = (e) => {
        // Keep cursor before the unit suffix
        if (value && inputRef.current) {
            const maxPos = value.length;
            const currentPos = e.target.selectionStart;
            if (currentPos > maxPos) {
                inputRef.current.setSelectionRange(maxPos, maxPos);
            }
        }
    };

    const handleClick = (e) => {
        // On click, position cursor before unit suffix
        if (value && inputRef.current) {
            const maxPos = value.length;
            setTimeout(() => {
                if (inputRef.current && inputRef.current.selectionStart > maxPos) {
                    inputRef.current.setSelectionRange(maxPos, maxPos);
                }
            }, 0);
        }
    };

    const handleKeyDown = (e) => {
        // Prevent cursor from moving into unit suffix area
        if (value && inputRef.current) {
            const maxPos = value.length;
            const currentPos = inputRef.current.selectionStart;

            // If pressing right arrow or end and would go past the digits, prevent it
            if ((e.key === 'ArrowRight' || e.key === 'End') && currentPos >= maxPos) {
                e.preventDefault();
            }
        }
    };

    useEffect(() => {
        // After value update, ensure cursor stays before unit suffix
        if (value && inputRef.current && document.activeElement === inputRef.current) {
            const maxPos = value.length;
            inputRef.current.setSelectionRange(maxPos, maxPos);
        }
    }, [value]);

    return (
        <input
            ref={inputRef}
            className={`input-field py-2 ${className}`}
            value={displayValue}
            onChange={handleChange}
            onSelect={handleSelect}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        />
    );
}

export default function Home() {
    const isProcessingRef = useRef(false);
    const [formData, setFormData] = useState({
        branchName: "",
        branchCode: "",
        refNo: "",
        date: "",
        inspectionDate: "",
        client: "",
        createdBy: "",
        approvedBy: "",
        generalObservations: [""],
        snapshots: [],
        powerParameters: {
            lineVoltage: { ry: "", yb: "", br: "" },
            phaseVoltage: { rn: "", yn: "", bn: "" },
            neutralEarth: { ne: "" },
            current: { r: "", y: "", b: "", n: "" },
            frequency: "",
            powerFactor: "",
            remarks: {
                ry: "", yb: "", br: "",
                rn: "", yn: "", bn: "",
                ne: "",
                r: "", y: "", b: "", n: "",
                frequency: "",
                powerFactor: ""
            }
        },
        connectedLoad: [],
        conclusions: [""],
        majorHighlights: [""],
        signature: null,
        useDefaultSignature: true,
        logo: null,
    });

    // Prevent accidental page refresh/navigation when form has data
    useEffect(() => {
        const hasFormData = () => {
            // Check if any meaningful data has been entered
            return (
                formData.branchName ||
                formData.branchCode ||
                formData.refNo ||
                formData.client ||
                formData.snapshots.length > 0 ||
                formData.connectedLoad.length > 0 ||
                formData.generalObservations.some(obs => obs.trim() !== "") ||
                formData.conclusions.some(conc => conc.trim() !== "") ||
                formData.majorHighlights.some(h => h.trim() !== "") ||
                formData.powerParameters.phaseVoltage.rn ||
                formData.powerParameters.phaseVoltage.yn ||
                formData.powerParameters.phaseVoltage.bn ||
                formData.powerParameters.current.r ||
                formData.powerParameters.current.y ||
                formData.powerParameters.current.b ||
                formData.powerParameters.frequency ||
                formData.powerParameters.powerFactor
            );
        };

        const handleBeforeUnload = (e) => {
            if (hasFormData()) {
                e.preventDefault();
                // Modern browsers require returnValue to be set
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [formData]);

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
        if (isProcessingRef.current) return;
        const files = Array.from(e.target.files);
        if (!files.length) return;

        isProcessingRef.current = true;
        e.target.value = '';

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

        isProcessingRef.current = false;
    };

    // Add MORE photos to an EXISTING group
    const handleAddPhotosToGroup = async (e, groupIndex) => {
        if (isProcessingRef.current) return;
        const files = Array.from(e.target.files);
        if (!files.length) return;

        isProcessingRef.current = true;
        e.target.value = '';

        const newImages = [];
        for (const file of files) {
            if (file.size <= 20 * 1024 * 1024) {
                const img = await resizeImage(file, 'image/jpeg', 0.8);
                newImages.push(img);
            }
        }

        setFormData((prev) => ({
            ...prev,
            snapshots: prev.snapshots.map((group, idx) => {
                if (idx === groupIndex) {
                    return {
                        ...group,
                        images: [...group.images, ...newImages]
                    };
                }
                return group;
            })
        }));

        isProcessingRef.current = false;
    };

    const removeImageFromGroup = (groupIndex, imageIndex) => {
        setFormData((prev) => ({
            ...prev,
            snapshots: prev.snapshots.map((group, idx) => {
                if (idx === groupIndex) {
                    return {
                        ...group,
                        images: group.images.filter((_, i) => i !== imageIndex)
                    };
                }
                return group;
            })
        }));
    };

    const handleSnapshotDescChange = (value, index) => {
        setFormData((prev) => ({
            ...prev,
            snapshots: prev.snapshots.map((group, idx) => {
                if (idx === index) {
                    return { ...group, description: value };
                }
                return group;
            })
        }));
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
            const newLoads = prev.connectedLoad.map((load, idx) => {
                if (idx === index) {
                    const updatedLoad = { ...load, [field]: value };
                    // Auto calc subtotal
                    if (field === "power" || field === "qty") {
                        const power = parseFloat(field === "power" ? value : updatedLoad.power) || 0;
                        const qty = parseFloat(field === "qty" ? value : updatedLoad.qty) || 0;
                        updatedLoad.subTotal = ((power * qty) / 1000).toFixed(3); // KW
                    }
                    return updatedLoad;
                }
                return load;
            });
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
        setFormData((prev) => ({
            ...prev,
            conclusions: prev.conclusions.map((item, idx) => (idx === index ? value : item))
        }));
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

    // General Observations
    const addObservation = () => {
        setFormData((prev) => ({
            ...prev,
            generalObservations: [...prev.generalObservations, ""],
        }));
    };

    const removeObservation = (index) => {
        setFormData((prev) => ({
            ...prev,
            generalObservations: prev.generalObservations.filter((_, i) => i !== index),
        }));
    };

    const handleObservationChange = (value, index) => {
        setFormData((prev) => {
            const newObservations = [...prev.generalObservations];
            newObservations[index] = value;
            return { ...prev, generalObservations: newObservations };
        });
    };

    const handlePowerParamChange = (field, subField, value) => {
        // Skip validation for remarks field - allow any characters
        if (field !== "remarks") {
            // 1. Determine allowed decimal places
            let maxDecimals = 1; // Default for Phase Voltage, Current, Neutral Earth
            if (field === "frequency" || field === "powerFactor") {
                maxDecimals = 2;
            }

            // 2. Validate Input (Allow empty or matching defined precision)
            // Regex Explanation: Starts with digits, optionally followed by a dot and up to maxDecimals digits
            const regex = new RegExp(`^\\d*(\\.\\d{0,${maxDecimals}})?$`);

            // If value serves as a partial input (like "1."), it's valid.
            // If it exceeds precision (like "1.23" for 1 decimal), we block it.
            if (value && !regex.test(value)) {
                return; // Reject change
            }
        }

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
                    // Calculation rounded to 1 decimal place as per "other values" rule
                    const lineVal = (phaseVal * Math.sqrt(3)).toFixed(1);
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

                <CollapsibleCard
                    title="General Observations"
                    icon={Activity}
                    theme="green"
                    bodyClassName="card-body space-y-4"
                    headerContent={({ expand }) =>
                        formData.generalObservations.length === 0 && (
                            <button
                                onClick={(e) => {
                                    expand(e);
                                    addObservation();
                                }}
                                className="btn-add flex items-center gap-2"
                            >
                                <Plus size={16} /> Add First Observation
                            </button>
                        )
                    }
                >
                    {formData.generalObservations.map((observation, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <span className="text-green-500 pt-3 text-lg">•</span>
                            <div className="flex-1">
                                <RichTextEditor
                                    value={observation}
                                    onChange={(val) => handleObservationChange(val, index)}
                                    placeholder="Enter observation details..."
                                />
                            </div>
                            <button
                                onClick={() => removeObservation(index)}
                                className="flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold mt-2 shadow-sm border border-green-100"
                                title="Delete Observation"
                            >
                                <Trash2 size={14} />
                                <span>Delete</span>
                            </button>
                        </div>
                    ))}
                    {formData.generalObservations.length > 0 && (
                        <div className="flex justify-center pt-4">
                            <button onClick={addObservation} className="btn-add flex items-center gap-2 w-full md:w-auto justify-center">
                                <Plus size={16} /> Add Another Observation
                            </button>
                        </div>
                    )}
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
                            <div className="flex-1">
                                <RichTextEditor
                                    value={highlight}
                                    onChange={(val) => handleHighlightChange(val, index)}
                                    placeholder="Enter a major highlight..."
                                />
                            </div>
                            <button
                                onClick={() => removeHighlight(index)}
                                className="flex items-center gap-2 bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold mt-2 shadow-sm border border-orange-100"
                                title="Delete Highlight"
                            >
                                <Trash2 size={14} />
                                <span>Delete</span>
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
                                        className="btn-add flex items-center gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold border border-purple-100"
                                        title="Delete Entire Group"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Description - Prominent at Top for the Group */}
                                    <div>
                                        <RichTextEditor
                                            placeholder="Describe the observations for this set of photos..."
                                            value={group.description}
                                            onChange={(val) => handleSnapshotDescChange(val, groupIndex)}
                                        />
                                    </div>

                                    {/* Responsive Image Grid */}
                                    <div className="py-2">
                                        <div className="flex flex-wrap gap-4">
                                            {group.images.map((img, imgIndex) => (
                                                <div key={imgIndex} className="relative group/img">
                                                    <div
                                                        className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                                                        style={{ width: '150px', height: '120px' }}
                                                    >
                                                        <img
                                                            src={img}
                                                            alt={`Snapshot ${imgIndex + 1} `}
                                                            className="w-full h-full object-cover"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>

                                                    {/* Delete Button as Overlay Badge */}
                                                    <button
                                                        onClick={() => removeImageFromGroup(groupIndex, imgIndex)}
                                                        className="absolute -top-2 -right-2 flex items-center gap-1.5 bg-purple-50 text-purple-600 hover:bg-red-50 hover:text-red-600 p-1.5 rounded-full border border-purple-200 hover:border-red-200 transition-all shadow-md z-10"
                                                        title="Remove Image"
                                                    >
                                                        <Trash2 size={14} />
                                                        <span className="text-[10px] font-bold pr-1">Delete</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty State */}
                        {formData.snapshots.length === 0 && (
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
                        )}

                        {/* Footer Action */}
                        {formData.snapshots.length > 0 && (
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
                        )}
                    </div>
                </CollapsibleCard>

                {/* 4. Power Parameters - Orange Theme */}
                {/* 4. Power Parameters - Orange Theme */}
                <CollapsibleCard title="Power Parameters" icon={Zap} theme="orange" bodyClassName="card-body overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr>
                                <th className="w-1/4">Parameter</th>
                                <th className="w-1/6">Test Point</th>
                                <th>Value</th>
                                <th className="w-1/4 pr-10">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            {/* Line Voltage */}
                            <tr>
                                <td rowSpan={3} className="font-semibold text-slate-700 bg-slate-50">
                                    Line Voltage (Auto Calculated)
                                </td>
                                <td className="font-medium text-slate-500">RY</td>
                                <td><input className="input-field py-2 bg-slate-50 text-slate-500" value={formData.powerParameters.lineVoltage.ry ? `${formData.powerParameters.lineVoltage.ry} V` : ''} readOnly placeholder="R-N * √3" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.ry} onChange={(e) => handlePowerParamChange("remarks", "ry", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">YB</td>
                                <td><input className="input-field py-2 bg-slate-50 text-slate-500" value={formData.powerParameters.lineVoltage.yb ? `${formData.powerParameters.lineVoltage.yb} V` : ''} readOnly placeholder="Y-N * √3" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.yb} onChange={(e) => handlePowerParamChange("remarks", "yb", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">BR</td>
                                <td><input className="input-field py-2 bg-slate-50 text-slate-500" value={formData.powerParameters.lineVoltage.br ? `${formData.powerParameters.lineVoltage.br} V` : ''} readOnly placeholder="B-N * √3" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.br} onChange={(e) => handlePowerParamChange("remarks", "br", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            {/* Phase Voltage */}
                            <tr>
                                <td rowSpan={3} className="font-semibold text-slate-700 bg-slate-50">Phase Voltage</td>
                                <td className="font-medium text-slate-500">R-N</td>
                                <td><UnitInput value={formData.powerParameters.phaseVoltage.rn} onChange={(val) => handlePowerParamChange("phaseVoltage", "rn", val)} unit="V" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.rn} onChange={(e) => handlePowerParamChange("remarks", "rn", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">Y-N</td>
                                <td><UnitInput value={formData.powerParameters.phaseVoltage.yn} onChange={(val) => handlePowerParamChange("phaseVoltage", "yn", val)} unit="V" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.yn} onChange={(e) => handlePowerParamChange("remarks", "yn", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">B-N</td>
                                <td><UnitInput value={formData.powerParameters.phaseVoltage.bn} onChange={(val) => handlePowerParamChange("phaseVoltage", "bn", val)} unit="V" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.bn} onChange={(e) => handlePowerParamChange("remarks", "bn", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            {/* Neutral to Earth */}
                            <tr>
                                <td className="font-semibold text-slate-700 bg-slate-50">Neutral to Earth</td>
                                <td className="font-medium text-slate-500">N-E</td>
                                <td><UnitInput value={formData.powerParameters.neutralEarth.ne} onChange={(val) => handlePowerParamChange("neutralEarth", "ne", val)} unit="V" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.ne} onChange={(e) => handlePowerParamChange("remarks", "ne", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            {/* Current */}
                            <tr>
                                <td rowSpan={4} className="font-semibold text-slate-700 bg-slate-50">Current</td>
                                <td className="font-medium text-slate-500">R</td>
                                <td><UnitInput value={formData.powerParameters.current.r} onChange={(val) => handlePowerParamChange("current", "r", val)} unit="A" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.r} onChange={(e) => handlePowerParamChange("remarks", "r", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">Y</td>
                                <td><UnitInput value={formData.powerParameters.current.y} onChange={(val) => handlePowerParamChange("current", "y", val)} unit="A" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.y} onChange={(e) => handlePowerParamChange("remarks", "y", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">B</td>
                                <td><UnitInput value={formData.powerParameters.current.b} onChange={(val) => handlePowerParamChange("current", "b", val)} unit="A" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.b} onChange={(e) => handlePowerParamChange("remarks", "b", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">N</td>
                                <td><UnitInput value={formData.powerParameters.current.n} onChange={(val) => handlePowerParamChange("current", "n", val)} unit="A" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.n} onChange={(e) => handlePowerParamChange("remarks", "n", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            {/* Freq & PF */}
                            <tr>
                                <td className="font-semibold text-slate-700 bg-slate-50">Frequency</td>
                                <td className="text-center text-slate-400">-</td>
                                <td><UnitInput value={formData.powerParameters.frequency} onChange={(val) => handlePowerParamChange("frequency", null, val)} unit="Hz" /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.frequency} onChange={(e) => handlePowerParamChange("remarks", "frequency", e.target.value)} placeholder="Remarks" /></td>
                            </tr>
                            <tr>
                                <td className="font-semibold text-slate-700 bg-slate-50">Power Factor</td>
                                <td className="text-center text-slate-400">-</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.powerFactor} onChange={(e) => handlePowerParamChange("powerFactor", null, e.target.value)} /></td>
                                <td className="pr-10"><textarea rows={1} className="input-field py-2" style={{ height: '42px', resize: 'none' }} value={formData.powerParameters.remarks.powerFactor} onChange={(e) => handlePowerParamChange("remarks", "powerFactor", e.target.value)} placeholder="Remarks" /></td>
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
                                            <button
                                                onClick={() => removeLoad(index)}
                                                className="flex items-center gap-1.5 bg-pink-50 text-pink-600 hover:bg-pink-100 px-2 py-1 rounded-lg border border-pink-100 transition-colors text-[10px] font-bold shadow-sm"
                                            >
                                                <Trash2 size={12} />
                                                <span>Delete</span>
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
                                            <button
                                                onClick={() => removeLoad(index)}
                                                className="flex items-center gap-2 bg-pink-50 text-pink-600 hover:bg-pink-100 px-3 py-1.5 rounded-lg transition-all shadow-sm border border-pink-100 text-xs font-semibold"
                                                title="Delete Row"
                                            >
                                                <Trash2 size={14} />
                                                <span>Delete</span>
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
                    {formData.conclusions.map((conclusion, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <span className="text-teal-500 pt-3 text-lg">•</span>
                            <div className="flex-1">
                                <RichTextEditor
                                    value={conclusion}
                                    onChange={(val) => handleConclusionChange(val, index)}
                                    placeholder="Enter a conclusion..."
                                />
                            </div>
                            <button
                                onClick={() => removeConclusion(index)}
                                className="flex items-center gap-2 bg-teal-50 text-teal-600 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold mt-2 shadow-sm border border-teal-100"
                                title="Delete Conclusion"
                            >
                                <Trash2 size={14} />
                                <span>Delete</span>
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
                                            src={formData.useDefaultSignature ? DEFAULT_SIGNATURE : formData.signature}
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
                                    <div className="flex items-center gap-3">
                                        {!formData.useDefaultSignature && formData.signature && (
                                            <button
                                                onClick={() => setFormData({ ...formData, signature: null })}
                                                className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all shadow-sm border border-blue-100 text-xs font-semibold"
                                                title="Delete Signature"
                                            >
                                                <Trash2 size={14} />
                                                <span>Delete Signature</span>
                                            </button>
                                        )}
                                    </div>
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
                                signature: formData.useDefaultSignature ? DEFAULT_SIGNATURE : formData.signature
                            })}
                            className="btn-primary flex items-center gap-3"
                        >
                            <Download size={24} />
                            Generate DOCX
                        </button>
                        <button
                            onClick={() => generatePdf({
                                ...formData,
                                signature: formData.useDefaultSignature ? DEFAULT_SIGNATURE : formData.signature
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
