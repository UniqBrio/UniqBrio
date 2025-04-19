"use client"

import { useState } from "react"
import Link from "next/link"
import { PlusCircle, Users, Calendar, Settings, LogOut, Bell, Search, Menu, X } from "lucide-react"

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("students")
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`bg-white w-64 p-6 shadow-md transition-all ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static h-full z-40`}
      >
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-2xl font-bold text-purple-700">UniqBrio</h1>
        </div>

        <nav className="space-y-2">
          <button
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${activeTab === "students" ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100"}`}
            onClick={() => setActiveTab("students")}
          >
            <Users size={20} />
            <span>Students/Members</span>
          </button>

          <button
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${activeTab === "schedule" ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100"}`}
            onClick={() => setActiveTab("schedule")}
          >
            <Calendar size={20} />
            <span>Schedule</span>
          </button>

          <button
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${activeTab === "settings" ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100"}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="absolute bottom-6 left-0 w-full px-6">
          <Link
            href="/login"
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 md:p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Fitness Studio</h1>
            <p className="text-gray-500">Welcome back!</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={24} className="text-gray-600 cursor-pointer" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                3
              </span>
            </div>

            <div className="h-10 w-10 bg-purple-200 rounded-full flex items-center justify-center">
              <span className="font-medium text-purple-700">FS</span>
            </div>
          </div>
        </header>

        {activeTab === "students" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Students/Members</h2>

              <div className="flex gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search members..."
                    className="pl-10 pr-4 py-2 border rounded-lg w-64"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>

                <button
                  className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition-colors"
                  onClick={() => setShowAddModal(true)}
                >
                  <PlusCircle size={18} />
                  <span>Add Member</span>
                </button>
              </div>
            </div>

            {/* Members list */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Membership
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-purple-200 rounded-full flex items-center justify-center">
                          <span className="font-medium text-purple-700">JD</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">John Doe</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">john.doe@example.com</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">+91 9876543210</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Premium</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center">
                          <span className="font-medium text-blue-700">JS</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">Jane Smith</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">jane.smith@example.com</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">+91 9876543211</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Basic</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-red-200 rounded-full flex items-center justify-center">
                          <span className="font-medium text-red-700">RJ</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">Robert Johnson</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">robert.j@example.com</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">+91 9876543212</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Premium</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Schedule</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-500">Schedule management coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Settings</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                      <input type="text" defaultValue="Fitness Studio" className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                      <input type="text" defaultValue="Gym" className="w-full p-2 border rounded-lg" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue="contact@fitnessstudio.com"
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="text" defaultValue="+91 8956648738" className="w-full p-2 border rounded-lg" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Address</h3>
                  <textarea
                    defaultValue="123 Fitness Lane, Mumbai, Maharashtra, India"
                    className="w-full p-2 border rounded-lg h-24"
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Add New Member</h3>
                <button onClick={() => setShowAddModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" className="w-full p-2 border rounded-lg" placeholder="Enter full name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full p-2 border rounded-lg" placeholder="Enter email address" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" className="w-full p-2 border rounded-lg" placeholder="Enter phone number" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option value="">Select membership type</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

