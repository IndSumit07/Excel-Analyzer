import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
    MapPin, FileText, Building2, X, CreditCard, Hash,
    Shield, User, Phone, Mail, Package, Calendar,
    CheckCircle, MessageSquare, Layers, FileSpreadsheet,
    MapPinned, Home, ZoomIn, ZoomOut, Maximize2, ArrowLeft,
    ChevronRight, ChevronDown
} from "lucide-react";

// Define helper function outside component to avoid initialization issues
const getLayerColor = (layerIndex) => {
    const colors = [
        { stroke: '#06b6d4', fill: '#06b6d4', bg: 'from-cyan-500 to-cyan-600' },
        { stroke: '#14b8a6', fill: '#14b8a6', bg: 'from-teal-500 to-teal-600' },
        { stroke: '#10b981', fill: '#10b981', bg: 'from-emerald-500 to-emerald-600' },
        { stroke: '#3b82f6', fill: '#3b82f6', bg: 'from-blue-500 to-blue-600' },
        { stroke: '#6366f1', fill: '#6366f1', bg: 'from-indigo-500 to-indigo-600' },
        { stroke: '#0ea5e9', fill: '#0ea5e9', bg: 'from-sky-500 to-sky-600' },
    ];
    return colors[layerIndex % colors.length];
};

export default function InteractiveTreeView({ data, onBack }) {
    const [selectedNode, setSelectedNode] = useState(null);
    const [zoom, setZoom] = useState(0.5);
    const [nodePositions, setNodePositions] = useState({});
    const [draggingNode, setDraggingNode] = useState(null);
    const [hasDragged, setHasDragged] = useState(false);
    const [expandedLayers, setExpandedLayers] = useState({});

    const toggleLayer = (layerNum) => {
        setExpandedLayers(prev => ({
            ...prev,
            [layerNum]: !prev[layerNum]
        }));
    };

    // Refs for high-performance direct DOM manipulation
    const svgGroupRef = useRef(null); // The <g> containing the grid and layers
    const panRef = useRef({ x: 0, y: 0 }); // Current pan {x, y}
    const panStartRef = useRef({ x: 0, y: 0 }); // Pan at start of drag
    const dragStartRef = useRef({ x: 0, y: 0 }); // Mouse position at start of drag
    const [isPanning, setIsPanning] = useState(false); // Flag for panning state
    const animationFrameRef = useRef(null); // For rAF loop
    const nodeDragStartPosRef = useRef(null); // Node position at start of drag

    // Organize nodes by layers
    const organizeByLayers = useCallback((node, layerMap = {}) => {
        if (node.name === "Transaction Flow") {
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => organizeByLayers(child, layerMap));
            }
            return layerMap;
        }

        const nodeLayer = node.layer || 0;
        if (!layerMap[nodeLayer]) {
            layerMap[nodeLayer] = [];
        }
        layerMap[nodeLayer].push(node);

        if (node.children && node.children.length > 0) {
            node.children.forEach(child => organizeByLayers(child, layerMap));
        }

        return layerMap;
    }, []);

    const layerMap = useMemo(() => organizeByLayers(data), [data, organizeByLayers]);
    const layers = useMemo(() => Object.keys(layerMap).map(Number).sort((a, b) => a - b), [layerMap]);

    // Initial Layout Calculation (Runs ONCE to set up the stack)
    useEffect(() => {
        // Only run if we haven't initialized positions yet
        setNodePositions(prev => {
            if (Object.keys(prev).length > 0) return prev;

            const positions = {};
            let currentY = 100;

            layers.forEach((layerNum) => {
                const nodes = layerMap[layerNum];

                // Hub Position
                const hubKey = `hub-${layerNum}`;
                positions[hubKey] = {
                    x: 100,
                    y: currentY
                };

                // Gap for collapsed state
                currentY += 120 + 50;
            });

            return positions;
        });
    }, [layers, layerMap]);

    // Expansion Layout Handling (Runs when layers are toggled)
    useEffect(() => {
        setNodePositions(prev => {
            const newPositions = { ...prev };

            Object.keys(expandedLayers).forEach(layerKey => {
                if (!expandedLayers[layerKey]) return; // Skip if collapsed

                const layerNum = parseInt(layerKey);
                const nodes = layerMap[layerNum];
                const hubKey = `hub-${layerNum}`;
                const hubPos = prev[hubKey]; // Get CURRENT Hub position!

                if (!hubPos) return;

                // Calculate Grid Props
                const rows = Math.ceil(nodes.length / 4);
                const gridHeight = rows * 200;

                // Calculate Children Positions Relative to Hub
                // New logic: Place grid to the RIGHT of the hub
                const startX = hubPos.x + 350; // 350px offset to right
                const startY = hubPos.y - (gridHeight / 2) + 60; // Vertically center grid on Hub

                nodes.forEach((node, nodeIndex) => {
                    if (node.name === "Transaction Flow") return;
                    const nodeKey = `node-${layerNum}-${nodeIndex}`;

                    // Only set position if not already set (or force update on expand? 
                    // Let's force update to ensure they align with the moved Hub)
                    const col = nodeIndex % 4;
                    const row = Math.floor(nodeIndex / 4);

                    newPositions[nodeKey] = {
                        x: startX + (col * 350),
                        y: startY + (row * 200)
                    };
                });
            });

            return newPositions;
        });
    }, [expandedLayers, layerMap]);

    // Apply Transform Helper - Updates DOM directly bypassing React render cycle
    const updateTransform = () => {
        if (svgGroupRef.current) {
            svgGroupRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoom})`;
        }
    };

    // Global Event Listeners for Dragging (prevents "sticking" if mouse leaves SVG)
    useEffect(() => {
        if (!isPanning && !draggingNode) return;

        const handleWindowMouseMove = (e) => {
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                setHasDragged(true);
            }

            if (isPanning) {
                const newX = panStartRef.current.x + dx;
                const newY = panStartRef.current.y + dy;

                panRef.current = { x: newX, y: newY };
                if (svgGroupRef.current) {
                    svgGroupRef.current.style.transform = `translate(${newX}px, ${newY}px) scale(${zoom})`;
                }
            } else if (draggingNode && nodeDragStartPosRef.current) {
                const newX = nodeDragStartPosRef.current.x + dx / zoom;
                const newY = nodeDragStartPosRef.current.y + dy / zoom;

                setNodePositions(prev => ({
                    ...prev,
                    [draggingNode]: {
                        x: newX,
                        y: newY
                    }
                }));
            }
        };

        const handleWindowMouseUp = () => {
            setIsPanning(false);
            setDraggingNode(null);
            nodeDragStartPosRef.current = null;
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isPanning, draggingNode, zoom]); // Re-bind when dragging state or zoom changes

    // Update transform when zoom changes (keep sync)
    useEffect(() => {
        updateTransform();
    }, [zoom]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
    const handleResetView = () => {
        setZoom(0.5);
        panRef.current = { x: 0, y: 0 };
        updateTransform();
    };

    const handleCanvasMouseDown = (e) => {
        // Since nodes stop propagation, any click reaching here is on the background
        setIsPanning(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        panStartRef.current = { ...panRef.current };
        setHasDragged(false);
    };

    const handleNodeMouseDown = (e, nodeKey) => {
        e.stopPropagation();
        setDraggingNode(nodeKey);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        nodeDragStartPosRef.current = { ...nodePositions[nodeKey] };
        setHasDragged(false);
    };

    const handleNodeClick = (node) => {
        if (!hasDragged && !draggingNode) {
            setSelectedNode(node);
        }
    };

    const handleCloseModal = () => setSelectedNode(null);

    // Memoize Connections Calculation
    const connections = useMemo(() => {
        const conns = [];
        layers.forEach((layerNum, layerIndex) => {
            const nodes = layerMap[layerNum];
            nodes.forEach((node, nodeIndex) => {
                if (node.name === "Transaction Flow") return;
                const nodeKey = `node-${layerNum}-${nodeIndex}`;
                const nodePos = nodePositions[nodeKey];
                if (!nodePos) return;

                const hubKey = `hub-${layerNum}`;
                const hubPos = nodePositions[hubKey];
                if (!hubPos) return;

                // Hub -> Account Spline
                conns.push({
                    key: `wire-${nodeKey}`,
                    d: `M ${hubPos.x + 200} ${hubPos.y + 60} C ${hubPos.x + 350} ${hubPos.y + 60}, ${nodePos.x - 100} ${nodePos.y + 70}, ${nodePos.x} ${nodePos.y + 70}`,
                    color: getLayerColor(layerIndex).stroke
                });
            });
        });
        return conns;
    }, [layers, layerMap, nodePositions]);

    const getAllAttributeValues = (attributes) => {
        if (!attributes) return [];
        const fields = [];
        const fieldMappings = [
            { keys: ['accountNo', 'accountno', 'Account No', 'AccountNo'], label: 'Account Number', Icon: CreditCard },
            { keys: ['sNo', 'sno', 'S.No', 'SNo'], label: 'Serial Number', Icon: Hash },
            { keys: ['fscCode', 'fsccode', 'FSC Code', 'FSC'], label: 'FSC Code', Icon: Building2 },
            { keys: ['state', 'State'], label: 'State', Icon: MapPin },
            { keys: ['district', 'District'], label: 'District', Icon: MapPinned },
            { keys: ['policeStation', 'Police Station'], label: 'Police Station', Icon: Shield },
            { keys: ['designation', 'Designation'], label: 'Designation', Icon: User },
            { keys: ['mobileNumber', 'Mobile Number', 'mobile', 'Phone'], label: 'Mobile Number', Icon: Phone },
            { keys: ['email', 'Email'], label: 'Email', Icon: Mail },
            { keys: ['layer', 'Layer'], label: 'Layer', Icon: Layers },
        ];

        fieldMappings.forEach(mapping => {
            for (const key of mapping.keys) {
                if (attributes[key] !== undefined && attributes[key] !== null && attributes[key] !== '') {
                    fields.push({ label: mapping.label, value: attributes[key], Icon: mapping.Icon });
                    break;
                }
            }
        });

        Object.keys(attributes).forEach(key => {
            if (fields.some(f => f.value === attributes[key]) || key === 'children' || key === '__rowNum__') return;
            const value = attributes[key];
            if (value !== null && value !== undefined && value !== '') {
                fields.push({
                    label: key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
                    value: value,
                    Icon: FileSpreadsheet
                });
            }
        });

        return fields;
    };

    return (
        <>
            <div className="fixed inset-0 bg-[#0a0e1a] flex flex-col z-[40]">
                {/* Minimal Eraser.io Style Header + Controls */}
                <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-[#0f1419]/90 backdrop-blur border border-slate-700 rounded-lg p-2 shadow-xl select-none">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded-md transition-colors border-r border-slate-700 pr-3 mr-1 text-slate-300 hover:text-white"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                    )}
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <span className="text-slate-200 font-semibold text-sm">Layer Map</span>
                </div>

                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-[#0f1419]/90 backdrop-blur border border-slate-700 rounded-lg p-1.5 shadow-xl select-none">
                    <button onClick={handleZoomOut} className="p-2 hover:bg-slate-700/50 rounded-md transition-colors"><ZoomOut className="w-4 h-4 text-slate-400" /></button>
                    <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-slate-700/50 rounded-md transition-colors"><ZoomIn className="w-4 h-4 text-slate-400" /></button>
                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
                    <button onClick={handleResetView} className="p-2 hover:bg-slate-700/50 rounded-md transition-colors"><Maximize2 className="w-4 h-4 text-slate-400" /></button>
                </div>

                {/* Infinite Canvas */}
                <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-[#0a0e1a] relative select-none">
                    <svg
                        width="100%"
                        height="100%"
                        className="block w-full h-full"
                        onMouseDown={handleCanvasMouseDown}
                    >
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="1" cy="1" r="1" fill="#334155" opacity="0.3" />
                            </pattern>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Transform Container (Hardware Accelerated) */}
                        <g
                            ref={svgGroupRef}
                            className="will-change-transform"
                            style={{ transformOrigin: '0 0', transform: `scale(${zoom})` }}
                        >
                            {/* Massive Background Grid Area for context */}
                            <rect x="-5000" y="-5000" width="20000" height="20000" fill="url(#grid)" />

                            {/* Draw Connections */}
                            {connections.map((conn) => {
                                // Extract layer layerNum from conn.key? 
                                // conn.key is `wire-node-${layerNum}-${nodeIndex}`
                                // We can use split.
                                const parts = conn.key.split('-');
                                const layerNum = parseInt(parts[2]);

                                // Only show wire if layer is expanded
                                if (!expandedLayers[layerNum]) return null;

                                return (
                                    <path
                                        key={conn.key}
                                        d={conn.d}
                                        stroke={conn.color}
                                        strokeWidth="2"
                                        fill="none"
                                        opacity="0.25"
                                        strokeDasharray="4,4"
                                    />
                                );
                            })}

                            {/* Draw Layers */}
                            {layers.map((layerNum, layerIndex) => {
                                const nodes = layerMap[layerNum];
                                const colors = getLayerColor(layerIndex);

                                // Key for the main Layer Hub
                                const hubKey = `hub-${layerNum}`;
                                const hubPos = nodePositions[hubKey] || { x: 100, y: 100 };

                                return (
                                    <g key={layerNum}>
                                        {/* Layer Hub Node (Draggable) */}
                                        <g
                                            className={`cursor-move ${draggingNode === hubKey ? '' : 'transition-all duration-500 ease-in-out'}`} // Disable transition while dragging this specific node
                                            onMouseDown={(e) => handleNodeMouseDown(e, hubKey)}
                                            transform={`translate(${hubPos.x}, ${hubPos.y})`}
                                        >
                                            <rect width="200" height="120" rx="16" fill="#0f1419" stroke={colors.stroke} strokeWidth="2" filter="url(#glow)" />
                                            <rect width="200" height="120" rx="16" fill={colors.fill} opacity="0.1" />

                                            <g transform="translate(20, 20)">
                                                <circle cx="20" cy="20" r="20" fill={colors.fill} opacity="0.2" />
                                                <Layers className="w-6 h-6 text-white" x="8" y="8" />
                                            </g>

                                            <text x="70" y="55" fill="white" fontSize="24" fontWeight="bold">
                                                {layerNum === 0 ? 'Root' : `Layer ${layerNum}`}
                                            </text>
                                            <text x="70" y="80" fill="#94a3b8" fontSize="14">
                                                {nodes.length} Accounts
                                            </text>

                                            {/* Expand/Collapse Toggle Button */}
                                            {/* Expand/Collapse Toggle Button - Moved to Right Center */}
                                            <g
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleLayer(layerNum);
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                transform="translate(200, 60)" // Centered on Right Edge
                                            >
                                                <circle r="14" fill={colors.stroke} stroke="#0f1419" strokeWidth="2" />
                                                {expandedLayers[layerNum] ? (
                                                    <ChevronDown className="w-5 h-5 text-white" x="-10" y="-10" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-white" x="-10" y="-10" />
                                                )}
                                            </g>
                                        </g>

                                        {/* Connections & Account Nodes (Conditionally Rendered with Animation) */}
                                        <g
                                            style={{
                                                opacity: expandedLayers[layerNum] ? 1 : 0,
                                                transition: 'opacity 0.5s ease-in-out',
                                                pointerEvents: expandedLayers[layerNum] ? 'auto' : 'none'
                                            }}
                                        >
                                            {/* Only render contents if opacity > 0 to save performance, 
                                                but for "smooth reveal" via CSS opacity we usually keep them in DOM.
                                                However, for "initially show only Layer" combined with "smoothly reveal",
                                                we can conditionally render with a keyframe animation OR use opacity state.
                                                Let's use conditional rendering but with a mounted check or standard CSS animation? 
                                                Actually, if we want TRUE smooth reveal (wires growing etc) that's complex.
                                                If we just want fade-in:
                                            */}
                                            {expandedLayers[layerNum] && (
                                                <>
                                                    {/* Wires */}
                                                    {/* Account Nodes */}
                                                    {nodes.map((node, nodeIndex) => {
                                                        if (node.name === "Transaction Flow") return null;
                                                        const nodeKey = `node-${layerNum}-${nodeIndex}`;
                                                        const nodePos = nodePositions[nodeKey] || { x: 0, y: 0 };

                                                        return (
                                                            <g
                                                                key={nodeKey}
                                                                className={`cursor-move group ${draggingNode === nodeKey ? '' : 'transition-all duration-500 ease-in-out'}`} // Match Hub movement behavior
                                                                onMouseDown={(e) => handleNodeMouseDown(e, nodeKey)}
                                                                onClick={() => handleNodeClick(node)}
                                                                transform={`translate(${nodePos.x}, ${nodePos.y})`}
                                                            >
                                                                <rect width="320" height="140" rx="12" fill="#0f1419" stroke={colors.stroke} strokeWidth="2" filter="url(#glow)" className="group-hover:stroke-cyan-400 transition-colors" />
                                                                <rect width="320" height="40" rx="12" fill={colors.fill} opacity="0.15" />
                                                                <rect x="15" y="10" width="50" height="20" rx="10" fill={colors.fill} />
                                                                <text x="40" y="24" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">L{layerNum}</text>
                                                                <text x="75" y="25" fill="white" fontSize="14" fontWeight="bold">
                                                                    {node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name}
                                                                </text>
                                                                {node.attributes?.state && (
                                                                    <text x="20" y="70" fill="#cbd5e1" fontSize="12">📍 {node.attributes.state}</text>
                                                                )}
                                                                {node.attributes?.fscCode && (
                                                                    <text x="20" y="95" fill="#cbd5e1" fontSize="12">🏢 {node.attributes.fscCode}</text>
                                                                )}
                                                                <rect x="130" y="134" width="60" height="3" rx="1.5" fill="#334155" />
                                                            </g>
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </g>
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                </div>
            </div>

            {/* Modal */}
            {selectedNode && selectedNode.name !== "Transaction Flow" && (
                <>
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" onClick={handleCloseModal} />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none overflow-hidden">
                        <div className="bg-[#0f1419] border-2 border-cyan-500/50 rounded-3xl shadow-2xl shadow-cyan-500/30 max-w-3xl w-full max-h-[85vh] overflow-hidden pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border-b-2 border-cyan-500/30 px-8 py-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-white">{selectedNode.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="px-3 py-1 bg-cyan-500 rounded-full text-white text-xs font-bold">
                                                Layer {selectedNode.layer}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleCloseModal} className="p-3 hover:bg-red-500/20 rounded-xl transition-colors group">
                                    <X className="w-6 h-6 text-slate-400 group-hover:text-red-400 transition-colors" />
                                </button>
                            </div>
                            <div className="px-8 py-6 max-h-[calc(85vh-140px)] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {getAllAttributeValues(selectedNode.attributes).map((field, idx) => {
                                        const IconComponent = field.Icon;
                                        return (
                                            <div key={idx} className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4 hover:border-cyan-500/50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <IconComponent className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                                                            {field.label}
                                                        </div>
                                                        <div className="text-base text-white font-medium break-words">
                                                            {String(field.value)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {getAllAttributeValues(selectedNode.attributes).length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">📭</div>
                                        <p className="text-slate-400 text-lg">No additional details available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
