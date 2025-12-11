"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Download, Camera, FileText, Zap, Activity, CheckCircle, PenTool, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { generateDocx } from "./utils/generateDocx";

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
        signature: null,

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

    // Snapshots
    const addSnapshot = () => {
        setFormData((prev) => ({
            ...prev,
            snapshots: [...prev.snapshots, { image: null, description: "" }],
        }));
    };

    const removeSnapshot = (index) => {
        setFormData((prev) => ({
            ...prev,
            snapshots: prev.snapshots.filter((_, i) => i !== index),
        }));
    };

    const handleImageUpload = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) { // 20 MB Check
                alert("File size exceeds 20MB limit.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => {
                    const newSnapshots = [...prev.snapshots];
                    newSnapshots[index].image = reader.result;
                    return { ...prev, snapshots: newSnapshots };
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSnapshotDescChange = (value, index) => {
        setFormData((prev) => {
            const newSnapshots = [...prev.snapshots];
            newSnapshots[index].description = value;
            return { ...prev, snapshots: newSnapshots };
        });
    };

    // Logo Upload
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) { // 20 MB Check
                alert("File size exceeds 20MB limit.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
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

                {/* 3. Snapshots - Purple Theme */}
                {/* 3. Snapshots - Purple Theme */}
                <CollapsibleCard
                    title="Snapshots"
                    icon={Camera}
                    theme="purple"
                    bodyClassName="card-body space-y-6"
                    headerContent={({ expand }) => (
                        <button
                            onClick={(e) => {
                                expand(e);
                                addSnapshot();
                            }}
                            className="btn-add flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Photo
                        </button>
                    )}
                >
                    {formData.snapshots.map((snap, index) => (
                        <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6 items-start">
                            <div className="shrink-0 flex flex-col gap-2">
                                <div
                                    className="relative bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shadow-sm"
                                    style={{ width: '80px', height: '64px', minWidth: '80px' }}
                                >
                                    {snap.image ? (
                                        <img
                                            src={snap.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="text-center p-2">
                                            <Camera className="mx-auto text-slate-300 mb-1" size={20} />
                                            <span className="text-slate-400 text-[10px] leading-tight block">No Image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 w-24">
                                    <label className="text-[10px] font-semibold text-slate-600">Upload</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="file-input scale-75 origin-top-left -mb-2"
                                        onChange={(e) => handleImageUpload(e, index)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 w-full flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-600">Description</label>
                                <textarea
                                    placeholder="Describe the issue shown in the image..."
                                    className="input-field flex-1 min-h-[120px]"
                                    value={snap.description}
                                    onChange={(e) => handleSnapshotDescChange(e.target.value, index)}
                                />
                            </div>
                            <button onClick={() => removeSnapshot(index)} className="text-slate-400 hover:text-red-500 p-2 transition-colors self-start md:self-center">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    {formData.snapshots.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors" onClick={addSnapshot}>
                            <Camera className="mx-auto text-slate-300 mb-2" size={48} />
                            <p className="text-slate-500 font-medium">No snapshots added yet</p>
                            <p className="text-blue-500 text-sm mt-1">Click "Add Photo" Button to add an image</p>
                        </div>
                    )}
                    {formData.snapshots.length > 0 && (
                        <div className="flex justify-center pt-4">
                            <button onClick={addSnapshot} className="btn-add flex items-center gap-2 w-full md:w-auto justify-center">
                                <Plus size={16} /> Add Another Photo
                            </button>
                        </div>
                    )}
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
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            {/* Line Voltage */}
                            <tr>
                                <td rowSpan={3} className="font-semibold text-slate-700 bg-slate-50">Line Voltage</td>
                                <td className="font-medium text-slate-500">RY</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.lineVoltage.ry} onChange={(e) => handleInputChange(e, "powerParameters", "lineVoltage", "ry")} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">YB</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.lineVoltage.yb} onChange={(e) => handleInputChange(e, "powerParameters", "lineVoltage", "yb")} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">BR</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.lineVoltage.br} onChange={(e) => handleInputChange(e, "powerParameters", "lineVoltage", "br")} /></td>
                            </tr>
                            {/* Phase Voltage */}
                            <tr>
                                <td rowSpan={3} className="font-semibold text-slate-700 bg-slate-50">Phase Voltage</td>
                                <td className="font-medium text-slate-500">R-N</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.phaseVoltage.rn} onChange={(e) => handleInputChange(e, "powerParameters", "phaseVoltage", "rn")} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">Y-N</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.phaseVoltage.yn} onChange={(e) => handleInputChange(e, "powerParameters", "phaseVoltage", "yn")} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">B-N</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.phaseVoltage.bn} onChange={(e) => handleInputChange(e, "powerParameters", "phaseVoltage", "bn")} /></td>
                            </tr>
                            {/* Neutral to Earth */}
                            <tr>
                                <td className="font-semibold text-slate-700 bg-slate-50">Neutral to Earth</td>
                                <td className="font-medium text-slate-500">N-E</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.neutralEarth.ne} onChange={(e) => handleInputChange(e, "powerParameters", "neutralEarth", "ne")} /></td>
                            </tr>
                            {/* Current */}
                            <tr>
                                <td rowSpan={4} className="font-semibold text-slate-700 bg-slate-50">Current</td>
                                <td className="font-medium text-slate-500">R</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.current.r} onChange={(e) => handleInputChange(e, "powerParameters", "current", "r")} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">Y</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.current.y} onChange={(e) => handleInputChange(e, "powerParameters", "current", "y")} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">B</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.current.b} onChange={(e) => handleInputChange(e, "powerParameters", "current", "b")} /></td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-500">N</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.current.n} onChange={(e) => handleInputChange(e, "powerParameters", "current", "n")} /></td>
                            </tr>
                            {/* Freq & PF */}
                            <tr>
                                <td className="font-semibold text-slate-700 bg-slate-50">Frequency</td>
                                <td className="text-center text-slate-400">-</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.frequency} onChange={(e) => handleInputChange(e, "powerParameters", "frequency")} /></td>
                            </tr>
                            <tr>
                                <td className="font-semibold text-slate-700 bg-slate-50">Power Factor</td>
                                <td className="text-center text-slate-400">-</td>
                                <td><input className="input-field py-2" value={formData.powerParameters.powerFactor} onChange={(e) => handleInputChange(e, "powerParameters", "powerFactor")} /></td>
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
                            <input
                                className="input-field"
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
                    <div className="flex items-center gap-6">
                        <div className="shrink-0 flex flex-col gap-2">
                            <div
                                className="relative bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shadow-sm"
                                style={{ width: '80px', height: '64px', minWidth: '80px' }}
                            >
                                {formData.signature ? (
                                    <img
                                        src={formData.signature}
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
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-600">Upload Signature</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="file-input w-full max-w-[200px]"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setFormData({ ...formData, signature: reader.result });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>
                            {formData.signature && (
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
                </CollapsibleCard>

                {/* Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex justify-center z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={() => generateDocx(formData)}
                        className="btn-primary flex items-center gap-3"
                    >
                        <Download size={24} />
                        Generate Report
                    </button>
                </div>
            </div >
        </main >
    );
}
