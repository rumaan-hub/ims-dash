"use client";

import React, { useEffect, useState } from 'react';
import './page.css';
import { apiCallManager } from '@/_api_/apiCallManager';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface Permission {
    permission_id: string;
    name: string;
    module: string;
}

interface Role {
    role_id: string;
    role_name: string;
    description: string;
    permissions: {
        permission: Permission;
    }[];
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', description: '' });

    const { hasPermission, loading: permsLoading } = usePermissions();
    const canManage = hasPermission('roles.manage');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [rolesData, permsData] = await Promise.all([
                apiCallManager.getRoles(),
                apiCallManager.getPermissions()
            ]);
            setRoles(rolesData);
            setPermissions(permsData);
            if (rolesData.length > 0) {
                setSelectedRole(rolesData[0]);
            }
        } catch (error) {
            console.error("Failed to fetch RBAC data", error);
            toast.error("Failed to load roles and permissions");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiCallManager.createRole(newRole);
            toast.success("New role created successfully!");
            setIsModalOpen(false);
            setNewRole({ name: '', description: '' });
            fetchInitialData();
        } catch {
            toast.error("Failed to create role");
        }
    };

    const togglePermission = async (permissionId: string) => {
        if (!selectedRole) return;

        const loadingId = toast.loading("Updating permissions...");
        try {
            await apiCallManager.togglePermission(selectedRole.role_id, permissionId);

            // Update local state to show the change immediately
            const updatedRoles = roles.map(r => {
                if (r.role_id === selectedRole.role_id) {
                    const hasPerm = r.permissions.some(p => p.permission.permission_id === permissionId);
                    if (hasPerm) {
                        return {
                            ...r,
                            permissions: r.permissions.filter(p => p.permission.permission_id !== permissionId)
                        };
                    } else {
                        const permToAdd = permissions.find(p => p.permission_id === permissionId);
                        if (permToAdd) {
                            return {
                                ...r,
                                permissions: [...r.permissions, { permission: permToAdd }]
                            };
                        }
                    }
                }
                return r;
            });

            setRoles(updatedRoles);
            const newSelectedRole = updatedRoles.find(r => r.role_id === selectedRole.role_id);
            if (newSelectedRole) {
                setSelectedRole(newSelectedRole);
            }

            toast.success("Permission updated!", { id: loadingId });
        } catch (error) {
            console.error("Toggle error:", error);
            toast.error("Failed to update permission", { id: loadingId });
        }
    };

    const modules = Array.from(new Set(permissions.map(p => p.module)));

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium font-inter">Synchronizing Security Protocols...</p>
        </div>
    );

    const getModuleIcon = (module: string) => {
        const icons: Record<string, string> = {
            'Roles': '🛡️',
            'Inventory': '📦',
            'Staff': '👥',
            'Ledger': '📓',
            'Purchase': '🛒',
            'Transfer': '🚛',
            'Default': '⚙️'
        };
        return icons[module] || icons['Default'];
    };

    return (
        <div className="roles-container">
            <header className="roles-header">
                <div className="flex items-center gap-4">
                    <h1 className="roles-title-h1">Access Control Matrix</h1>
                </div>
                {!permsLoading && canManage && (
                    <button className="add-role-btn" onClick={() => setIsModalOpen(true)}>
                        <span>+</span> Create New Role
                    </button>
                )}
            </header>

            <div className="roles-layout">
                {/* Sidebar */}
                <aside className={`roles-sidebar ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
                    <h3 className="sidebar-title">Global Security Roles</h3>
                    <div className="custom-scroll max-h-[calc(100vh-250px)] overflow-y-auto">
                        {roles.map(role => (
                            <div
                                key={role.role_id}
                                className={`role-item ${selectedRole?.role_id === role.role_id ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedRole(role);
                                    setIsSidebarOpen(false);
                                }}
                            >
                                <span className="role-item-name">{role.role_name}</span>
                                <span className="role-item-desc truncate-2">{role.description || 'System defined role'}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="permissions-area">
                    {selectedRole ? (
                        <div className="fade-in">
                            <div className="perm-header-content">
                                <h2 className="perm-header-title">Configuring &ldquo;{selectedRole.role_name}&rdquo;</h2>
                                <p className="perm-header-desc">{selectedRole.description || 'Adjust specific permission nodes for this authority level.'}</p>
                            </div>

                            <div className="permissions-grid">
                                {modules.map(module => (
                                    <div key={module} className="permission-module-card">
                                        <h4 className="module-title">
                                            <div className="module-icon-wrap">{getModuleIcon(module)}</div>
                                            {module}
                                        </h4>
                                        <div className="permission-list">
                                            {permissions.filter(p => p.module === module).map(perm => {
                                                return (
                                                    <label key={perm.permission_id} className="permission-checkbox-item">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-checkbox"
                                                            id={`perm-${perm.permission_id}`}
                                                            checked={selectedRole.permissions.some(p => p.permission.permission_id === perm.permission_id)}
                                                            onChange={() => togglePermission(perm.permission_id)}
                                                            disabled={permsLoading || !canManage}
                                                        />
                                                        <span className="permission-label">{perm.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🛡️</div>
                            <p className="text-xl font-bold text-gray-400">Select an Authority Node</p>
                            <p className="text-gray-400 max-w-xs text-center">Choose a role from the left sidebar to modify its system-wide access permissions.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Create Role Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Create New Role</h2>
                        <form onSubmit={handleCreateRole}>
                            <div className="form-field">
                                <label className="form-label">Role Name</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g., Inventory Supervisor"
                                    value={newRole.name}
                                    onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Enter what this role does..."
                                    value={newRole.description}
                                    onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="save-btn">Create Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
