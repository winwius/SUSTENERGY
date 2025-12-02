"use client";

import { useState } from "react";
import { Plus, Trash2, Download, Camera, FileText, Zap, Activity, CheckCircle } from "lucide-react";
import { generateDocx } from "./utils/generateDocx";

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
                <section className="colorful-card theme-blue">
                    <div className="card-header">
                        <FileText size={24} />
                        <h2 className="text-xl">General Information</h2>
                    </div>
                    <div className="card-body">
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
                    </div>
                </section>

                {/* 2. Observations - Green Theme */}
                <section className="colorful-card theme-green">
                    <div className="card-header">
                        <Activity size={24} />
                        <h2 className="text-xl">General Observations</h2>
                    </div>
                    <div className="card-body">
                        <textarea
                            placeholder="Enter detailed observations about the electrical installation..."
                            className="input-field min-h-[150px] resize-y"
                            value={formData.generalObservations}
                            onChange={(e) => handleInputChange(e, null, "generalObservations")}
                        />
                    </div>
                </section>

                {/* 3. Snapshots - Purple Theme */}
                <section className="colorful-card theme-purple">
                    <div className="card-header justify-between">
                        <div className="flex items-center gap-2">
                            <Camera size={24} />
                            <h2 className="text-xl">Snapshots</h2>
                        </div>
                        <button onClick={addSnapshot} className="btn-add flex items-center gap-2">
                            <Plus size={16} /> Add Photo
                        </button>
                    </div>
                    <div className="card-body space-y-6">
                        {formData.snapshots.map((snap, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-full md:w-1/3 shrink-0">
                                    <div className="relative aspect-video bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center group shadow-sm">
                                        {snap.image ? (
                                            <img src={snap.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <Camera className="mx-auto text-slate-300 mb-2" size={32} />
                                                <span className="text-slate-400 text-sm">No Image</span>
                                            </div>
                                        )}
                                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                            <span className="text-white font-medium px-4 py-2 bg-white/20 backdrop-blur rounded-full">Upload Image</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, index)} />
                                        </label>
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
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No snapshots added yet. Click "Add Photo" to start.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. Power Parameters - Orange Theme */}
                <section className="colorful-card theme-orange">
                    <div className="card-header">
                        <Zap size={24} />
                        <h2 className="text-xl">Power Parameters</h2>
                    </div>
                    <div className="card-body overflow-x-auto">
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
                    </div>
                </section>

                {/* 5. Connected Load - Pink Theme */}
                <section className="colorful-card theme-pink">
                    <div className="card-header justify-between">
                        <div className="flex items-center gap-2">
                            <Zap size={24} />
                            <h2 className="text-xl">Connected Load</h2>
                        </div>
                        <button onClick={addLoad} className="btn-add flex items-center gap-2">
                            <Plus size={16} /> Add Load
                        </button>
                    </div>
                    <div className="card-body overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th className="w-32">Power (W)</th>
                                    <th className="w-24">Qty</th>
                                    <th className="w-32">Sub Total (KW)</th>
                                    <th className="w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.connectedLoad.map((load, index) => (
                                    <tr key={index}>
                                        <td><input className="input-field py-2" value={load.type} onChange={(e) => handleLoadChange(index, "type", e.target.value)} placeholder="e.g. Light (LED)" /></td>
                                        <td><input type="number" className="input-field py-2" value={load.power} onChange={(e) => handleLoadChange(index, "power", e.target.value)} placeholder="0" /></td>
                                        <td><input type="number" className="input-field py-2" value={load.qty} onChange={(e) => handleLoadChange(index, "qty", e.target.value)} placeholder="0" /></td>
                                        <td><input className="input-field py-2 bg-slate-50 text-slate-500" value={load.subTotal} readOnly /></td>
                                        <td>
                                            <button onClick={() => removeLoad(index)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="text-right font-bold pt-6 text-slate-600">Total Connected Load (KW):</td>
                                    <td className="pt-6 font-bold text-xl text-pink-600">
                                        {formData.connectedLoad.reduce((acc, curr) => acc + (parseFloat(curr.subTotal) || 0), 0).toFixed(3)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                {/* 6. Conclusions - Teal Theme */}
                <section className="colorful-card theme-teal">
                    <div className="card-header justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={24} />
                            <h2 className="text-xl">Conclusions</h2>
                        </div>
                        <button onClick={addConclusion} className="btn-add flex items-center gap-2">
                            <Plus size={16} /> Add Point
                        </button>
                    </div>
                    <div className="card-body space-y-4">
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
                    </div>
                </section>

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
            </div>
        </main>
    );
}
