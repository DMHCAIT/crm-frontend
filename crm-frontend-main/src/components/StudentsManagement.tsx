import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import { 
  Search, 
  GraduationCap, 
  Calendar, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  UserPlus,
  X,
  Mail,
  Phone,
  MapPin,
  Building,
  Award,
  DollarSign,
  Activity
} from 'lucide-react';

const StudentsManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [originalLeadData, setOriginalLeadData] = useState<any>(null);
  const currentUser = user?.name || 'Unknown User';
  const currentUserRole = user?.role || 'team_leader';

  useEffect(() => {
    loadStudentsData();
  }, [user]);

  const loadStudentsData = async () => {
    try {
      // Get real students data from backend API (proper architecture)
      const apiClient = getApiClient();
      
      // Load both students and enrolled leads
      const [studentsData, leadsData] = await Promise.all([
        apiClient.getStudents(),
        apiClient.getLeads()
      ]);
      
      // Convert existing students data to frontend format
      const formattedStudents = Array.isArray(studentsData) ? 
        studentsData.map((student: any) => ({
          id: student.id,
          name: student.name || 'Unknown Student',
          email: student.email || '',
          phone: student.phone || '',
          course: student.course || 'Not specified',
          year: student.year || 'Module 1 of 1',
          status: student.status || 'active',
          enrollmentDate: student.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          feeStatus: student.fee_status || 'pending',
          documents: student.documents_status || 'incomplete',
          nextPayment: student.next_payment_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: student.fee_amount || (student.company === 'IBMP' ? '$0' : '₹0'),
          source: 'student_db'
        })) : [];

      // Convert enrolled leads to student format
      const leadsArray = (leadsData as any)?.leads || leadsData || [];
      const enrolledLeads = Array.isArray(leadsArray) ? 
        leadsArray
          .filter((lead: any) => lead.status === 'Enrolled')
          .map((lead: any) => ({
            id: `lead-${lead.id}`,
            originalLeadId: lead.id,
            name: lead.fullName || lead.name || 'Unknown Student',
            email: lead.email || '',
            phone: lead.phone || '',
            course: lead.course || 'Not specified',
            year: 'Module 1 of 1', // Default for newly enrolled
            status: 'active', // Enrolled leads are active students
            enrollmentDate: lead.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            feeStatus: (lead.salePrice || lead.sale_price) ? 'paid' : 'pending',
            documents: 'incomplete', // Default for new enrollments
            nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: (lead.salePrice || lead.sale_price) ? 
              (lead.company === 'IBMP' ? `$${(lead.salePrice || lead.sale_price).toLocaleString()}` : `₹${(lead.salePrice || lead.sale_price).toLocaleString()}`) : 
              (lead.company === 'IBMP' ? '$0' : '₹0'),
            assignedTo: lead.assignedTo || '',
            qualification: lead.qualification || '',
            country: lead.country || '',
            branch: lead.branch || '',
            company: lead.company || '',
            source: 'crm_lead',
            // Additional lead details for profile view
            originalLead: lead,
            salesperson: lead.assignedTo || lead.assignedCounselor || lead.assigned_to || 'Unknown',
            leadSource: lead.source || 'Unknown',
            createdAt: lead.createdAt || lead.created_at,
            notes: lead.notes || '',
            followUp: lead.followUp || lead.follow_up,
            lastContact: lead.lastContact || lead.last_contact
          })) : [];

      // Combine both data sources
      const combinedStudents = [...formattedStudents, ...enrolledLeads];
      setStudents(combinedStudents);
      
    } catch (error) {
      console.error('Error loading students data:', error);
      // Fallback to empty array if data loading fails
      setStudents([]);
    }
  };

  // Get the combined students data
  const allStudents = students;

  // Role-based student filtering
  const getAccessibleStudents = () => {
    if (currentUserRole === 'super_admin' || currentUserRole === 'senior_manager' || currentUserRole === 'manager') {
      return allStudents; // Can see all students
    } else if (currentUserRole === 'team_leader' || currentUserRole === 'counselor') {
      return allStudents.filter(student => 
        student.admittedBy === currentUser || 
        (student.assignedCounselor && student.assignedCounselor === currentUser)
      ); // Can only see students they admitted or are assigned to
    }
    return [];
  };

  const accessibleStudents = getAccessibleStudents();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'graduated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'discontinued':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFeeStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'incomplete':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const tabs = [
    { id: 'all', label: 'All Enrolled', count: accessibleStudents.length },
    { id: 'active', label: 'Currently Learning', count: accessibleStudents.filter(s => s.status === 'active').length },
    { id: 'pending-docs', label: 'Pending Documents', count: accessibleStudents.filter(s => s.documents === 'incomplete').length },
    { id: 'fee-pending', label: 'Fee Pending', count: accessibleStudents.filter(s => s.feeStatus !== 'paid').length }
  ];

  const getFilteredStudents = () => {
    if (activeTab === 'all') return accessibleStudents;
    if (activeTab === 'active') return accessibleStudents.filter(s => s.status === 'active');
    if (activeTab === 'pending-docs') return accessibleStudents.filter(s => s.documents === 'incomplete');
    if (activeTab === 'fee-pending') return accessibleStudents.filter(s => s.feeStatus !== 'paid');
    return accessibleStudents;
  };

  const handleViewProfile = async (student: any) => {
    setSelectedStudent(student);
    
    // If this is a converted lead, get the original lead data for more details
    if (student.originalLeadId) {
      try {
        const apiClient = getApiClient();
        const leadData: any = await apiClient.getLeads();
        const leadsArray = leadData?.leads || leadData || [];
        const originalLead = leadsArray.find((lead: any) => lead.id === student.originalLeadId);
        setOriginalLeadData(originalLead);
      } catch (error) {
        console.error('Error loading original lead data:', error);
        setOriginalLeadData(null);
      }
    } else {
      setOriginalLeadData(null);
    }
    
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedStudent(null);
    setOriginalLeadData(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">DMHCA Course Enrollment Management</h1>
        
        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search enrolled doctors by name, course, or enrollment ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>All Courses</option>
            <option>Fellowship Programs</option>
            <option>PG Diploma Courses</option>
            <option>Certification Courses</option>
            <option>Critical Care</option>
            <option>Emergency Medicine</option>
            <option>Cardiology</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>All Years</option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>4th Year</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Role-based Access Info */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-blue-600" />
          <p className="text-sm text-blue-700">
            <strong>Your Access Level:</strong> {currentUserRole.replace('_', ' ').toUpperCase()} - 
            {(currentUserRole === 'team_leader' || currentUserRole === 'counselor') 
              ? ` Showing only doctors you've enrolled or are assigned to (${accessibleStudents.length} enrolled doctors)`
              : ` Full access to all enrolled doctors (${accessibleStudents.length} enrolled doctors)`
            }
          </p>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {getFilteredStudents().map((student) => (
          <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(student.status)}`}>
                  {student.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Course Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700">{student.course}</span>
                </div>
                <span className="text-sm text-gray-500">{student.year}</span>
              </div>

              {/* Show admission source for converted students */}
              {student.originalLeadId && (
                <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  <UserPlus className="w-3 h-3" />
                  <span>Converted from Lead</span>
                </div>
              )}

              {/* Enrollment Date */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}
                </span>
              </div>

              {/* Fee Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Fee Status</span>
                  {getFeeStatusIcon(student.feeStatus)}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{student.amount}</p>
                  <p className="text-xs text-gray-500">
                    Due: {student.nextPayment ? new Date(student.nextPayment).toLocaleDateString() : 'TBD'}
                  </p>
                </div>
              </div>

              {/* Documents Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Documents</span>
                  {getDocumentStatusIcon(student.documents)}
                </div>
                <span className={`text-sm font-medium ${
                  student.documents === 'complete' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {student.documents.charAt(0).toUpperCase() + student.documents.slice(1)}
                </span>
              </div>

              {/* Show admitted by info for converted students */}
              {student.admittedBy && (
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Admitted by:</strong> {student.admittedBy}
                </p>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => handleViewProfile(student)}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Profile
                </button>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                  Contact
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">856</h3>
          <p className="text-sm text-gray-500">Total Enrolled</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">742</h3>
          <p className="text-sm text-gray-500">Currently Learning</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">23</h3>
          <p className="text-sm text-gray-500">Pending Docs</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">12</h3>
          <p className="text-sm text-gray-500">Fee Overdue</p>
        </div>
      </div>

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Student Profile</h3>
                  <p className="text-blue-100 text-sm">Enrolled Student Details & Lead History</p>
                </div>
              </div>
              <button
                onClick={closeProfileModal}
                className="text-blue-100 hover:text-white transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Student Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Student Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-1 text-gray-500" />
                      {selectedStudent.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-500" />
                      {selectedStudent.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <p className="text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                      {selectedStudent.country || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-green-600" />
                  Academic Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Enrolled</label>
                    <p className="text-gray-900">{selectedStudent.course}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                    <p className="text-gray-900">{selectedStudent.year}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                    <p className="text-gray-900">{selectedStudent.qualification || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <p className="text-gray-900 flex items-center">
                      <Building className="w-4 h-4 mr-1 text-gray-500" />
                      {selectedStudent.company ? 
                        (selectedStudent.company === 'DMHCA' ? '🏥 DMHCA' : '🎓 IBMP') : 
                        'Not specified'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Enrollment & Financial Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                  Enrollment & Financial Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                      {formatDate(selectedStudent.enrollmentDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedStudent.feeStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedStudent.feeStatus === 'paid' ? '✅ Paid' : '⏰ Pending'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Fee</label>
                    <p className="text-gray-900 font-medium">{selectedStudent.amount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Documents Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedStudent.documents === 'complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedStudent.documents === 'complete' ? '✅ Complete' : '📄 Incomplete'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sales & Lead Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-orange-600" />
                  Sales & Lead History
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">🎯 Sale Completed By</label>
                    <p className="font-medium text-green-700">
                      {selectedStudent.salesperson || selectedStudent.assignedTo || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                    <p className="text-gray-900">{selectedStudent.leadSource || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lead Created</label>
                    <p className="text-gray-900">
                      {selectedStudent.createdAt ? formatDate(selectedStudent.createdAt) : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact</label>
                    <p className="text-gray-900">
                      {selectedStudent.lastContact ? formatDate(selectedStudent.lastContact) : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Notes */}
              {selectedStudent.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">Lead Notes</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedStudent.notes}</p>
                </div>
              )}

              {/* Original Lead Data (if available) */}
              {originalLeadData && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">Complete Lead Journey</h4>
                  <div className="text-sm text-gray-600">
                    <p><strong>Original Lead ID:</strong> #{originalLeadData.id}</p>
                    <p><strong>Lead Progress:</strong> {originalLeadData.source} → {originalLeadData.status} → Enrolled</p>
                    <p><strong>Total Journey Time:</strong> {
                      selectedStudent.createdAt && selectedStudent.enrollmentDate ? 
                      Math.ceil((new Date(selectedStudent.enrollmentDate).getTime() - new Date(selectedStudent.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + ' days' :
                      'Unknown'
                    }</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Call Student</span>
                </button>
                <button className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Send Email</span>
                </button>
                <button
                  onClick={closeProfileModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagement;