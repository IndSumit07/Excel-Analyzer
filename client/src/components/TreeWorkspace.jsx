import { useState, useEffect, useMemo } from "react";
import {
  MapPin, Hash, FileText, Building2, MapPinned, Home,
  Shield, User, Phone, Mail, CreditCard, Package,
  Calendar, CheckCircle, MessageSquare, Layers, X, FileSpreadsheet,
  LayoutGrid, GitBranch, ChevronRight, ChevronDown
} from "lucide-react";
import InteractiveTreeView from "./InteractiveTreeView";

export default function TreeWorkspace({ data }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [viewMode, setViewMode] = useState("layer"); // "layer" or "tree"
  const [expandedPhases, setExpandedPhases] = useState({});

  const togglePhase = (layerNum) => {
    setExpandedPhases(prev => {
      const isCurrentlyExpanded = prev[layerNum] !== false;
      return {
        ...prev,
        [layerNum]: !isCurrentlyExpanded
      };
    });
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedNode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedNode]);

  // Organize nodes by their actual layer attribute (not tree depth)
  const organizeByLayers = (node, layerMap = {}) => {
    // Skip the root "Transaction Flow" node
    if (node.name === "Transaction Flow") {
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => organizeByLayers(child, layerMap));
      }
      return layerMap;
    }

    // Use the actual layer attribute from the node
    const nodeLayer = node.layer || 0;

    if (!layerMap[nodeLayer]) {
      layerMap[nodeLayer] = [];
    }

    // Add current node to its actual layer
    layerMap[nodeLayer].push(node);

    // Process children recursively
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        organizeByLayers(child, layerMap);
      });
    }

    return layerMap;
  };

  const layerMap = useMemo(() => organizeByLayers(data), [data]);
  const layers = useMemo(() => Object.keys(layerMap).map(Number).sort((a, b) => a - b), [layerMap]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleCloseModal = () => {
    setSelectedNode(null);
  };

  const handleMouseEnter = (node) => {
    setHoveredNode(node);
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

  // Helper function to get all possible values from attributes
  const getAllAttributeValues = (attributes) => {
    if (!attributes) return [];

    const fields = [];

    // Define all possible field mappings with Lucide icons
    const fieldMappings = [
      {
        keys: ['accountNo', 'accountno', 'Account No', 'Account No.', 'AccountNo', 'Account_No', 'acc_no', 'Acknowledgement N', 'AcknowledgementN'],
        label: 'Account Number',
        Icon: CreditCard
      },
      {
        keys: ['sNo', 'sno', 'S.No', 'S No', 'SNo', 'Serial No', 'SerialNo', 'serial_no'],
        label: 'Serial Number',
        Icon: Hash
      },
      {
        keys: ['acknowledgementN', 'acknowledgementn', 'Acknowledgement N', 'Acknowledgement', 'AcknowledgementN', 'ack_no'],
        label: 'Acknowledgement',
        Icon: FileText
      },
      {
        keys: ['ifscCode', 'ifsccode', 'IFSC Code', 'IFSCCode', 'IFSC', 'ifsc_code', 'ifsc'],
        label: 'IFSC Code',
        Icon: Building2
      },
      {
        keys: ['state', 'State', 'STATE', 'state_name', 'StateName'],
        label: 'State',
        Icon: MapPin
      },
      {
        keys: ['district', 'District', 'DISTRICT', 'district_name', 'DistrictName'],
        label: 'District',
        Icon: MapPinned
      },
      {
        keys: ['policeStation', 'policestation', 'Police Station', 'PoliceStation', 'police Station Name of Complain reported officer', 'PS Name', 'ps_name', 'police_station'],
        label: 'Police Station',
        Icon: Shield
      },
      {
        keys: ['designation', 'Designation', 'DESIGNATION', 'post', 'Post', 'Position'],
        label: 'Designation',
        Icon: User
      },
      {
        keys: ['mobileNumber', 'mobilenumber', 'Mobile Number', 'MobileNumber', 'Mobile', 'mobile', 'Phone', 'phone', 'Contact', 'contact_no', 'mobile_no'],
        label: 'Mobile Number',
        Icon: Phone
      },
      {
        keys: ['email', 'Email', 'EMAIL', 'E-mail', 'e-mail', 'EmailID', 'email_id', 'email_address'],
        label: 'Email',
        Icon: Mail
      },
      {
        keys: ['name', 'Name', 'NAME', 'full_name', 'FullName', 'PersonName', 'person_name'],
        label: 'Name',
        Icon: User
      },
      {
        keys: ['address', 'Address', 'ADDRESS', 'full_address', 'FullAddress'],
        label: 'Address',
        Icon: Home
      },
      {
        keys: ['pincode', 'Pincode', 'PINCODE', 'PIN', 'pin', 'postal_code', 'PostalCode', 'zip'],
        label: 'Pincode',
        Icon: MapPin
      },
      {
        keys: ['amount', 'Amount', 'AMOUNT', 'transaction_amount', 'TransactionAmount', 'value', 'Value'],
        label: 'Amount',
        Icon: Package
      },
      {
        keys: ['date', 'Date', 'DATE', 'transaction_date', 'TransactionDate', 'timestamp', 'Timestamp'],
        label: 'Date',
        Icon: Calendar
      },
      {
        keys: ['status', 'Status', 'STATUS', 'transaction_status', 'TransactionStatus'],
        label: 'Status',
        Icon: CheckCircle
      },
      {
        keys: ['remarks', 'Remarks', 'REMARKS', 'comments', 'Comments', 'notes', 'Notes', 'description', 'Description'],
        label: 'Remarks',
        Icon: MessageSquare
      },
      {
        keys: ['layer', 'Layer', 'LAYER', 'level', 'Level'],
        label: 'Layer',
        Icon: Layers
      },
    ];

    // Try to find values for each field mapping
    fieldMappings.forEach(mapping => {
      for (const key of mapping.keys) {
        if (attributes[key] !== undefined && attributes[key] !== null && attributes[key] !== '') {
          fields.push({
            label: mapping.label,
            value: attributes[key],
            Icon: mapping.Icon
          });
          break; // Found a match, move to next mapping
        }
      }
    });

    // Add any remaining attributes that weren't matched
    Object.keys(attributes).forEach(key => {
      // Skip if already added or if it's a common internal field
      if (fields.some(f => f.value === attributes[key]) ||
        key === 'children' ||
        key === '__rowNum__') {
        return;
      }

      // Add with a generic icon
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

  // Color scheme for different layers
  const getLayerColor = (layerIndex) => {
    const colors = [
      { bg: 'from-cyan-500 to-cyan-600', border: 'border-cyan-400', shadow: 'shadow-cyan-500/30', glow: 'bg-cyan-500/10' },
      { bg: 'from-teal-500 to-teal-600', border: 'border-teal-400', shadow: 'shadow-teal-500/30', glow: 'bg-teal-500/10' },
      { bg: 'from-emerald-500 to-emerald-600', border: 'border-emerald-400', shadow: 'shadow-emerald-500/30', glow: 'bg-emerald-500/10' },
      { bg: 'from-blue-500 to-blue-600', border: 'border-blue-400', shadow: 'shadow-blue-500/30', glow: 'bg-blue-500/10' },
      { bg: 'from-indigo-500 to-indigo-600', border: 'border-indigo-400', shadow: 'shadow-indigo-500/30', glow: 'bg-indigo-500/10' },
      { bg: 'from-sky-500 to-sky-600', border: 'border-sky-400', shadow: 'shadow-sky-500/30', glow: 'bg-sky-500/10' },
    ];
    return colors[layerIndex % colors.length];
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0e1a] overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0a0e1a] via-[#0a0e1a]/95 to-transparent backdrop-blur-sm border-b border-slate-800/50">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent mb-2">
                Transaction Flow Analyzer
              </h1>
              <p className="text-slate-400 font-medium">Interactive layer-based hierarchy visualization</p>
            </div>
            <div className="flex gap-4">
              {/* View Mode Toggle */}
              <div className="flex gap-2 p-1 bg-[#0f1419] border border-slate-800 rounded-xl">
                <button
                  onClick={() => setViewMode("layer")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${viewMode === "layer"
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Layer View
                </button>
                <button
                  onClick={() => setViewMode("tree")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${viewMode === "tree"
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Tree View
                </button>
              </div>

              <div className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">Total Accounts</div>
                <div className="text-3xl font-bold text-white">{data.attributes?.totalAccounts || 0}</div>
              </div>
              <div className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">Layers</div>
                <div className="text-3xl font-bold text-white">{data.attributes?.totalLayers || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional View Rendering */}
      {viewMode === "tree" ? (
        // Full screen tree view - no headers
        <InteractiveTreeView data={data} onBack={() => setViewMode("layer")} />
      ) : (
        <>
          {/* Header - Only for Layer View */}
          <div className="bg-gradient-to-r from-[#0f1419] to-[#0a0e1a] border-b-2 border-slate-800 sticky top-0 z-20">
            <div className="max-w-[1800px] mx-auto px-8 py-6">
              <div className="flex items-center justify-between">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewMode("layer")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${viewMode === "layer"
                      ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Layer View
                  </button>
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${viewMode === "tree"
                      ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                  >
                    <GitBranch className="w-4 h-4" />
                    Tree View
                  </button>
                </div>

                <div className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                  <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">Total Accounts</div>
                  <div className="text-3xl font-bold text-white">{data.attributes?.totalAccounts || 0}</div>
                </div>
                <div className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                  <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">Layers</div>
                  <div className="text-3xl font-bold text-white">{data.attributes?.totalLayers || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Layer-wise Display with Phase Style */}
          <div className="max-w-[1800px] mx-auto px-8 py-12">
            <div className="space-y-6">
              {layers.map((layerNum, layerIndex) => {
                const nodes = layerMap[layerNum];
                const colors = getLayerColor(layerIndex);
                const isRootLayer = layerNum === 0;
                const isExpanded = expandedPhases[layerNum] !== false; // Default to expanded

                return (
                  <div key={layerNum} className="animate-fade-in" style={{ animationDelay: `${layerIndex * 50}ms` }}>
                    {/* Layer Parent Node */}
                    <div
                      className={`bg-[#0f1419] border-2 ${colors.border} rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:${colors.shadow}`}
                    >
                      {/* Layer Header - Clickable */}
                      <div
                        className={`bg-gradient-to-r ${colors.bg} p-6 cursor-pointer flex items-center justify-between group`}
                        onClick={() => togglePhase(layerNum)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Layers className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                              {isRootLayer ? 'Root Layer' : `Layer ${layerNum}`}
                            </h2>
                            <p className="text-white/80 text-sm font-medium mt-1">
                              {nodes.length} {nodes.length === 1 ? 'Account' : 'Accounts'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <span className="text-white font-bold text-lg">{nodes.length}</span>
                          </div>
                          <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="w-6 h-6 text-white" />
                            ) : (
                              <ChevronRight className="w-6 h-6 text-white" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Child Accounts - Collapsible */}
                      {isExpanded && (
                        <div className="p-6 bg-[#0a0e1a]/50">
                          {/* Accounts Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {nodes.map((node, nodeIndex) => {
                              if (node.name === "Transaction Flow") return null;

                              const hasChildren = node.children && node.children.length > 0;
                              const isHovered = hoveredNode?.name === node.name;

                              return (
                                <div
                                  key={`${layerNum}-${nodeIndex}`}
                                  className="relative group"
                                >
                                  {/* Account Card */}
                                  <div
                                    className={`bg-[#0f1419] border-2 ${colors.border} rounded-xl p-5 cursor-pointer transition-all duration-300 ${isHovered ? 'scale-105 shadow-xl -translate-y-1' : 'hover:scale-105 hover:shadow-xl hover:-translate-y-1'
                                      } hover:${colors.shadow}`}
                                    onClick={() => handleNodeClick(node)}
                                    onMouseEnter={() => handleMouseEnter(node)}
                                    onMouseLeave={handleMouseLeave}
                                  >
                                    {/* Glow Effect */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />

                                    {/* Content */}
                                    <div className="relative z-10">
                                      {/* Account Number */}
                                      <div className="mb-3">
                                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                                          Account No
                                        </div>
                                        <div className="text-lg font-bold text-white truncate">
                                          {node.name}
                                        </div>
                                      </div>

                                      {/* Quick Info */}
                                      {node.attributes && (
                                        <div className="space-y-2">
                                          {node.attributes.state && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                              <span className="text-slate-400 truncate">{node.attributes.state}</span>
                                            </div>
                                          )}
                                          {node.attributes.fscCode && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Building2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                              <span className="text-slate-400 truncate">{node.attributes.fscCode}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Children Badge */}
                                      {hasChildren && (
                                        <div className="mt-4 pt-3 border-t border-slate-700/50">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-semibold">Connected Accounts</span>
                                            <div className={`px-3 py-1 bg-gradient-to-r ${colors.bg} rounded-full text-white text-xs font-bold`}>
                                              {node.children.length}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Click Indicator */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="text-xs text-cyan-400 font-semibold">Click for details</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Modal for Selected Node */}
      {selectedNode && selectedNode.name !== "Transaction Flow" && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-hidden">
            <div
              className="bg-[#0f1419] border-2 border-cyan-500/50 rounded-3xl shadow-2xl shadow-cyan-500/30 max-w-3xl w-full max-h-[85vh] overflow-hidden pointer-events-auto animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
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
                      {selectedNode.children && selectedNode.children.length > 0 && (
                        <div className="px-3 py-1 bg-teal-500 rounded-full text-white text-xs font-bold">
                          {selectedNode.children.length} Connected
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  className="p-3 hover:bg-red-500/20 rounded-xl transition-colors group"
                >
                  <X className="w-6 h-6 text-slate-400 group-hover:text-red-400 transition-colors" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6 max-h-[calc(85vh-140px)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getAllAttributeValues(selectedNode.attributes).map((field, idx) => {
                    const IconComponent = field.Icon;
                    return (
                      <div
                        key={idx}
                        className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4 hover:border-cyan-500/50 transition-colors"
                      >
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

                {/* No data message */}
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

    </div>
  );
}
