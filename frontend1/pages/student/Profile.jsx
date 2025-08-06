import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X } from 'lucide-react';

const Profile = () => {
    const { currentUser, updateUserProfile, isLoading } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        full_name: currentUser?.full_name || '',
        email: currentUser?.email || '',
        mobile: currentUser?.mobile || '',
        address: currentUser?.address || '',
        date_of_birth: currentUser?.date_of_birth || '',
        gender: currentUser?.gender || '',
        emergency_contact_name: currentUser?.emergency_contact_name || '',
        emergency_contact_mobile: currentUser?.emergency_contact_mobile || '',
        guardian_name: currentUser?.guardian_name || '',
        guardian_mobile: currentUser?.guardian_mobile || ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async () => {
        try {
            if (updateUserProfile) {
                await updateUserProfile(profileData);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleCancelEdit = () => {
        setProfileData({
            full_name: currentUser?.full_name || '',
            email: currentUser?.email || '',
            mobile: currentUser?.mobile || '',
            address: currentUser?.address || '',
            date_of_birth: currentUser?.date_of_birth || '',
            gender: currentUser?.gender || '',
            emergency_contact_name: currentUser?.emergency_contact_name || '',
            emergency_contact_mobile: currentUser?.emergency_contact_mobile || '',
            guardian_name: currentUser?.guardian_name || '',
            guardian_mobile: currentUser?.guardian_mobile || ''
        });
        setIsEditing(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-dark">My Profile</h1>
                    <p className="text-text-medium mt-1">Manage your personal information and contact details.</p>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} leftIcon={<Edit2 size={16} />}>
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleCancelEdit} leftIcon={<X size={16} />}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} leftIcon={<Save size={16} />} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Profile Overview Card */}
                <Card className="xl:col-span-1">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-purple to-primary-purple-light rounded-full flex items-center justify-center mx-auto mb-4">
                            <User size={32} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-text-dark">{currentUser?.full_name || 'Student Name'}</h2>
                        <p className="text-text-medium">{currentUser?.email}</p>
                        <div className="mt-4 pt-4 border-t border-subtle-border">
                            <div className="flex items-center justify-center gap-2 text-sm text-text-medium mb-2">
                                <Calendar size={16} />
                                <span>Member since {new Date(currentUser?.created_at || Date.now()).getFullYear()}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm text-text-medium">
                                <MapPin size={16} />
                                <span>{profileData.address || 'Address not provided'}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Profile Details */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <h3 className="text-lg font-bold text-text-dark mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                name="full_name"
                                value={profileData.full_name}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                leftIcon={<User size={16} />}
                            />
                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                value={profileData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                leftIcon={<Mail size={16} />}
                            />
                            <Input
                                label="Mobile Number"
                                name="mobile"
                                value={profileData.mobile}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                leftIcon={<Phone size={16} />}
                            />
                            <Input
                                label="Date of Birth"
                                name="date_of_birth"
                                type="date"
                                value={profileData.date_of_birth}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                leftIcon={<Calendar size={16} />}
                            />
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-text-medium mb-1.5">Gender</label>
                                <select
                                    name="gender"
                                    value={profileData.gender}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 bg-slate-100 rounded-xl shadow-soft-ui-inset focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-text-medium mb-1.5">Address</label>
                                <textarea
                                    name="address"
                                    value={profileData.address}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-100 rounded-xl shadow-soft-ui-inset focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Enter your complete address"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Guardian Information */}
                    <Card>
                        <h3 className="text-lg font-bold text-text-dark mb-4">Guardian Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Guardian Name"
                                name="guardian_name"
                                value={profileData.guardian_name}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                leftIcon={<User size={16} />}
                            />
                            <Input
                                label="Guardian Mobile"
                                name="guardian_mobile"
                                value={profileData.guardian_mobile}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                leftIcon={<Phone size={16} />}
                            />
                        </div>
                    </Card>

                    {/* Emergency Contact */}
                    <Card>
                        <h3 className="text-lg font-bold text-text-dark mb-4">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Emergency Contact Name"
                                name="emergency_contact_name"
                                value={profileData.emergency_contact_name}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                leftIcon={<User size={16} />}
                            />
                            <Input
                                label="Emergency Contact Mobile"
                                name="emergency_contact_mobile"
                                value={profileData.emergency_contact_mobile}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                leftIcon={<Phone size={16} />}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Profile;