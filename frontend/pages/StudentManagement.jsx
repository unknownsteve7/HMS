import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import StatusTag from '../components/ui/StatusTag';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Edit, Trash2, Save, X } from 'lucide-react';

const StudentManagement = () => {
  const { students, deleteStudent, updateStudent, fetchStudents, isLoading } = useAppContext();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasFetched = useRef(false);

  // Debug logging
  useEffect(() => {
    console.log('🎓 StudentManagement - students data:', students);
    console.log('🎓 StudentManagement - students length:', students.length);
    console.log('🎓 StudentManagement - students type:', typeof students);
  }, [students]);

  // Always fetch students when component mounts
  useEffect(() => {
    if (fetchStudents) {
      console.log('🎓 StudentManagement - Component mounted, fetching students...');
      fetchStudents().then(result => {
        console.log('🎓 StudentManagement - Fetched students result:', result);
      }).catch(error => {
        console.error('❌ StudentManagement - Error fetching students:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  // Reset fetch flag when students are received
  useEffect(() => {
    if (students.length > 0) {
      hasFetched.current = true;
    }
  }, [students.length]);

  const filteredStudents = useMemo(() => {
    console.log('🔍 Filtering students:', students);
    console.log('🔍 Search term:', searchTerm);
    console.log('🔍 Branch filter:', branchFilter);
    console.log('🔍 Year filter:', yearFilter);
    console.log('🔍 Gender filter:', genderFilter);

    if (!Array.isArray(students)) {
      console.warn('⚠️ Students is not an array:', students);
      return [];
    }

    return students.filter(student => {
      if (!student) {
        console.warn('⚠️ Found null/undefined student:', student);
        return false;
      }

      const regNumber = student.registrationNumber || student.Registration_number || '';
      const studentName = student.full_name || student.name || '';
      const studentEmail = student.email_address || student.email || '';
      const studentBranch = student.Branch || student.branch || student.department || '';
      const studentYear = student.Year || student.year || student.academic_year || '';
      const studentGender = student.gender || student.Gender || '';

      const searchMatch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const branchMatch = branchFilter === 'All' || studentBranch === branchFilter;
      const genderMatch = genderFilter === 'All' || studentGender.toLowerCase() === genderFilter.toLowerCase();

      // Enhanced year matching to handle different formats
      let yearMatch = yearFilter === 'All';
      if (!yearMatch && yearFilter !== 'All') {
        const studentYearStr = studentYear.toString().toLowerCase();

        // Map filter values to possible data values
        const yearMappings = {
          '1st': ['1', '1st', 'first', 'i'],
          '2nd': ['2', '2nd', 'second', 'ii'],
          '3rd': ['3', '3rd', 'third', 'iii'],
          '4th': ['4', '4th', 'fourth', 'iv']
        };

        const possibleValues = yearMappings[yearFilter] || [];
        yearMatch = possibleValues.some(val => studentYearStr.includes(val.toLowerCase()));
      }

      // Debug log for each student
      if (searchTerm || branchFilter !== 'All' || yearFilter !== 'All' || genderFilter !== 'All') {
        console.log(`🔍 Student: ${studentName} | Branch: ${studentBranch} | Year: ${studentYear} | Gender: "${studentGender}" | Matches: search=${searchMatch}, branch=${branchMatch}, year=${yearMatch}, gender=${genderMatch}`);
        console.log(`🔍   Filter values: branch="${branchFilter}", year="${yearFilter}", gender="${genderFilter}"`);
        console.log(`🔍   Final result: ${searchMatch && branchMatch && yearMatch && genderMatch}`);
      }

      return searchMatch && branchMatch && yearMatch && genderMatch;
    });
  }, [students, searchTerm, branchFilter, yearFilter, genderFilter]);

  const branches = useMemo(() => {
    // Fixed predefined branches
    const predefinedBranches = ['All', 'CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT'];
    console.log('🏢 Using predefined branches:', predefinedBranches);
    return predefinedBranches;
  }, []);

  const years = useMemo(() => {
    // Fixed predefined years
    const predefinedYears = ['All', '1st', '2nd', '3rd', '4th'];
    console.log('📅 Using predefined years:', predefinedYears);
    return predefinedYears;
  }, []);

  const genders = useMemo(() => {
    // Fixed predefined genders
    const predefinedGenders = ['All', 'Male', 'Female'];
    console.log('👥 Using predefined genders:', predefinedGenders);
    return predefinedGenders;
  }, []);

  const handleDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;

    try {
      setIsDeleting(true);
      addToast('Deleting student...', 'info');

      const response = await deleteStudent(studentToDelete.student_id || studentToDelete._student_id);
      console.log('🗑️ Delete response:', response);

      // Handle both 204 No Content and other success responses
      if (response && (response.status === 204 || response.success)) {
        addToast(`Student "${studentToDelete.full_name || studentToDelete.name}" deleted successfully!`, 'success');
      } else {
        addToast(`Student "${studentToDelete.full_name || studentToDelete.name}" deleted successfully!`, 'success');
      }

      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Failed to delete student:', error);
      addToast('Failed to delete student. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setEditFormData({
      full_name: student.full_name || student.name || '',
      Registration_number: student.Registration_number || student.registrationNumber || '',
      Branch: student.Branch || student.branch || student.department || '',
      Year: student.Year || student.year || student.academic_year || '',
      gender: student.gender || student.Gender || '',
      email_address: student.email_address || student.email || '',
      mobile_number: student.mobile_number || student.mobile || student.phone || '',
      status: student.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      addToast('Updating student...', 'info');
      await updateStudent(editingStudent.student_id || editingStudent._student_id, editFormData);
      addToast(`Student ${editFormData.full_name} updated successfully!`, 'success');
      setIsEditModalOpen(false);
      setEditingStudent(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update student:', error);
      addToast('Failed to update student. Please try again.', 'error');
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
    setEditFormData({});
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow lg:flex-grow-0 lg:w-1/3">
            <Input
              placeholder="Search by name, registration no, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 lg:flex-grow">
            <div className="flex-1 sm:max-w-48">
              <Select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                {branches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
              </Select>
            </div>
            <div className="flex-1 sm:max-w-48">
              <Select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                {years.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : `${y} Year`}</option>)}
              </Select>
            </div>
            <div className="flex-1 sm:max-w-48">
              <Select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                {genders.map(g => <option key={g} value={g}>{g === 'All' ? 'All Genders' : g}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-text-dark mb-4">
          Student List ({filteredStudents.length})
          {isLoading && <span className="text-sm text-text-medium ml-2">(Loading...)</span>}
        </h2>

        {/* Active Filters Indicator */}
        {(searchTerm || branchFilter !== 'All' || yearFilter !== 'All' || genderFilter !== 'All') && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Search: "{searchTerm}"
                </span>
              )}
              {branchFilter !== 'All' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Branch: {branchFilter}
                </span>
              )}
              {yearFilter !== 'All' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Year: {yearFilter}
                </span>
              )}
              {genderFilter !== 'All' && (
                <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                  Gender: {genderFilter}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Debug info */}


        <Table headers={['Name', 'Registration No', 'Branch', 'Year', 'Gender', 'Email', 'Mobile', 'Status', 'Actions']}>
          {filteredStudents.map((student, index) => (
            <TableRow key={student.id || student._id || index}>
              <TableCell className="font-semibold text-text-dark">{student.full_name || 'N/A'}</TableCell>
              <TableCell>{student.registrationNumber || student.Registration_number || 'N/A'}</TableCell>
              <TableCell>{student.Branch || student.department || 'N/A'}</TableCell>
              <TableCell>{student.Year || student.academic_year || 'N/A'}</TableCell>
              <TableCell>{student.gender || student.Gender || 'N/A'}</TableCell>
              <TableCell>{student.email_address || 'N/A'}</TableCell>
              <TableCell>{student.mobile_number || student.phone || 'N/A'}</TableCell>
              <TableCell><StatusTag status={student.status || 'active'} /></TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="!p-2"
                    onClick={() => handleEdit(student)}
                    title="Edit Student"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    className="!p-2"
                    onClick={() => handleDelete(student)}
                    title="Delete Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        {filteredStudents.length === 0 && !isLoading && (
          <div className="text-center p-8">
            <p className="text-text-medium">No students found.</p>
            <Button
              onClick={() => fetchStudents?.()}
              className="mt-2"
              variant="secondary"
            >
              Refresh Students
            </Button>
          </div>
        )}
      </Card>

      {/* Edit Student Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCancelEdit} title={`Edit Student - ${editingStudent?.full_name || editingStudent?.name}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="full_name"
              value={editFormData.full_name || ''}
              onChange={handleEditFormChange}
              placeholder="Enter full name"
            />
            <Input
              label="Registration Number"
              name="Registration_number"
              value={editFormData.Registration_number || ''}
              onChange={handleEditFormChange}
              placeholder="Enter registration number"
            />
            <Select
              label="Branch"
              name="Branch"
              value={editFormData.Branch || ''}
              onChange={handleEditFormChange}
            >
              <option value="">Select Branch</option>
              {['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
            <Select
              label="Year"
              name="Year"
              value={editFormData.Year || ''}
              onChange={handleEditFormChange}
            >
              <option value="">Select Year</option>
              {['1st', '2nd', '3rd', '4th'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
            <Select
              label="Gender"
              name="gender"
              value={editFormData.gender || ''}
              onChange={handleEditFormChange}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Input
              label="Email Address"
              name="email_address"
              type="email"
              value={editFormData.email_address || ''}
              onChange={handleEditFormChange}
              placeholder="Enter email address"
            />
            <Input
              label="Mobile Number"
              name="mobile_number"
              value={editFormData.mobile_number || ''}
              onChange={handleEditFormChange}
              placeholder="Enter mobile number"
            />
            <Select
              label="Status"
              name="status"
              value={editFormData.status || 'active'}
              onChange={handleEditFormChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </Select>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="secondary" onClick={handleCancelEdit} leftIcon={<X className="w-4 h-4" />}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} leftIcon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Student"
        message={
          studentToDelete
            ? `Are you sure you want to delete "${studentToDelete.full_name || studentToDelete.name}"? This action cannot be undone and will permanently remove all student data.`
            : "Are you sure you want to delete this student?"
        }
        confirmText="Delete Student"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default StudentManagement;