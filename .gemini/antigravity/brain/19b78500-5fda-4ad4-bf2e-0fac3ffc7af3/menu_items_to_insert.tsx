// Add these lines after line 269 (before </div>):

                                <button 
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowSettings(false)
                                        setEditingItem(null)
                                        setIsModalOpen(true)
                                    }}
                                >
                                    <Plus size={14} /> Nuevo Material
                                </button>
                                <button 
                                    className="dropdown-item" 
                                    onClick={() => {
                                        setShowSettings(false)
                                        fileInputRef.current?.click()
                                    }}
                                >
                                    <Upload size={14} /> Importar Excel
                                </button>
                                <button 
                                    className="dropdown-item" 
                                    onClick={() => {
                                        setShowSettings(false)
                                        handleExport()
                                    }}
                                >
                                    <Download size={14} /> Exportar
                                </button>
                                <div className="dropdown-divider"></div>
