import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Phone, IdCard, GraduationCap, Calendar, Shield, Edit3, Save, X } from 'lucide-react';

const Profile = () => {
    const { currentUser, userRole, fetchUserProfile, isLoading } = useAppContext();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({});

    // Load profile data when component mounts
    useEffect(() => {
        const loadProfile = async () => {
            try {
                await fetchUserProfile();
            } catch (error) {
                console.error('Failed to load profile:', error);
                addToast('Failed to load profile information', 'error');
            }
        };

        if (!currentUser) {
            loadProfile();
        } else {
            setProfileData(currentUser);
        }
    }, [fetchUserProfile, currentUser, addToast]);

    // Update local state when currentUser changes
    useEffect(() => {
        if (currentUser) {
            setProfileData(currentUser);
        }
    }, [currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            // TODO: Implement profile update API call
            addToast('Profile update functionality will be implemented soon', 'info');
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            addToast('Failed to update profile', 'error');
        }
    };

    const handleCancel = () => {
        setProfileData(currentUser || {});
        setIsEditing(false);
    };

    if (isLoading && !currentUser) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <div className="text-center">
                    <Spinner size="lg" className="mb-4" />
                    <p className="text-text-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    const renderField = (label, value, icon, name, type = 'text', disabled = false) => (
        <div className="mb-6">
            <label className="block text-sm font-medium text-text-medium mb-2 flex items-center gap-2">
                {icon}
                {label}
            </label>
            {isEditing && !disabled ? (
                <Input
                    name={name}
                    type={type}
                    value={value || ''}
                    onChange={handleInputChange}
                    className="w-full"
                />
            ) : (
                <div className="px-4 py-3 bg-slate-100 rounded-xl text-text-dark border border-gray-200">
                    {value || 'Not provided'}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">
                        {userRole === 'admin' ? 'Admin Profile' : 'My Profile'}
                    </h1>
                    <p className="text-text-medium mt-1">
                        View and manage your profile information
                    </p>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <Button
                                variant="secondary"
                                onClick={handleCancel}
                                leftIcon={<X className="w-4 h-4" />}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                leftIcon={<Save className="w-4 h-4" />}
                            >
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={() => setIsEditing(true)}
                            leftIcon={<Edit3 className="w-4 h-4" />}
                        >
                            Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Summary Card */}
                <Card className="lg:col-span-1">
                    <div className="text-center p-6">
                        <div className="w-24 h-24 bg-primary-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            {userRole === 'admin' ? (
                                <Shield className="w-12 h-12 text-primary-purple" />
                            ) : (
                                <User className="w-12 h-12 text-primary-purple" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-text-dark mb-2">
                            {profileData.full_name || profileData.name || 'User'}
                        </h2>
                        <p className="text-text-medium text-sm mb-4">
                            {userRole === 'admin' ? 'System Administrator' : 'Student'}
                        </p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-center gap-2">
                                <Mail className="w-4 h-4 text-text-medium" />
                                <span className="text-text-dark">
                                    {profileData.email_address || profileData.email || 'No email'}
                                </span>
                            </div>
                            {profileData.mobile_number && (
                                <div className="flex items-center justify-center gap-2">
                                    <Phone className="w-4 h-4 text-text-medium" />
                                    <span className="text-text-dark">{profileData.mobile_number}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Profile Details Card */}
                <Card className="lg:col-span-2">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-text-dark mb-6">Profile Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Common fields for both admin and student */}
                            {renderField(
                                'Full Name',
                                profileData.full_name || profileData.name,
                                <User className="w-4 h-4" />,
                                'full_name'
                            )}

                            {renderField(
                                'Email Address',
                                profileData.email_address || profileData.email,
                                <Mail className="w-4 h-4" />,
                                'email_address',
                                'email'
                            )}

                            {renderField(
                                'Mobile Number',
                                profileData.mobile_number || profileData.mobile,
                                <Phone className="w-4 h-4" />,
                                'mobile_number',
                                'tel'
                            )}

                            {/* Student-specific fields */}
                            {userRole === 'student' && (
                                <>
                                    {renderField(
                                        'Registration Number',
                                        profileData.Registration_number || profileData.registrationNumber,
                                        <IdCard className="w-4 h-4" />,
                                        'Registration_number',
                                        'text',
                                        true // Read-only for students
                                    )}

                                    {renderField(
                                        'Branch',
                                        profileData.Branch || profileData.branch,
                                        <GraduationCap className="w-4 h-4" />,
                                        'Branch'
                                    )}

                                    {renderField(
                                        'Year',
                                        profileData.Year || profileData.year,
                                        <Calendar className="w-4 h-4" />,
                                        'Year'
                                    )}
                                </>
                            )}

                            {/* Admin-specific fields */}
                            {userRole === 'admin' && (
                                <>
                                    {renderField(
                                        'Employee ID',
                                        profileData.employee_id || profileData.employeeId,
                                        <IdCard className="w-4 h-4" />,
                                        'employee_id',
                                        'text',
                                        true // Read-only for admins
                                    )}

                                    {renderField(
                                        'Department',
                                        profileData.department,
                                        <Shield className="w-4 h-4" />,
                                        'department'
                                    )}
                                </>
                            )}
                        </div>

                        {/* Additional Information */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-md font-semibold text-text-dark mb-4">Account Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-text-medium">Account Type:</span>
                                    <span className="ml-2 text-text-dark font-medium capitalize">{userRole}</span>
                                </div>
                                <div>
                                    <span className="text-text-medium">Status:</span>
                                    <span className="ml-2 text-green-600 font-medium">
                                        {profileData.status || 'Active'}
                                    </span>
                                </div>
                                {profileData.created_at && (
                                    <div>
                                        <span className="text-text-medium">Member Since:</span>
                                        <span className="ml-2 text-text-dark">
                                            {new Date(profileData.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {profileData.last_login && (
                                    <div>
                                        <span className="text-text-medium">Last Login:</span>
                                        <span className="ml-2 text-text-dark">
                                            {new Date(profileData.last_login).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
