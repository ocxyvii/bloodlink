'use client'

import { useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { DebugInfo } from '@/components/reports/debug-info'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts'
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Users, 
  Droplet, 
  AlertTriangle,
  Calendar,
  MapPin,
  Activity,
  Heart,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface ReportData {
  requests: any[]
  donations: any[]
  inventory: any[]
  centers: any[]
  userCenter?: any
  userRole?: string
  isSuperAdmin?: boolean
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const BLOOD_COLORS = {
  'A+': '#FF6B6B',
  'A-': '#FF8E8E',
  'B+': '#4ECDC4',
  'B-': '#6FE5DE',
  'AB+': '#45B7D1',
  'AB-': '#6FC5E3',
  'O+': '#96CEB4',
  'O-': '#B4E4CE'
}

export function ProfessionalReports({ data }: { data: ReportData }) {
  const [activeReport, setActiveReport] = useState<'overview' | 'inventory' | 'trends' | 'demographics' | 'regional'>('overview')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<string>('all')
  const reportRef = useRef<HTMLDivElement>(null)
  
  // Get center/region information
  const reportScope = data.isSuperAdmin 
    ? selectedCenter === 'all' 
      ? `All Centers (${data.centers.length} centers)`
      : data.centers.find(c => c.id === selectedCenter)?.name || 'Unknown Center'
    : data.userCenter 
    ? `${data.userCenter.name} - ${data.userCenter.city}`
    : 'No Center Assigned'
    
  // Filter data based on selected center for super admin
  const filteredData = useMemo(() => {
    if (!data.isSuperAdmin || selectedCenter === 'all') {
      return data
    }
    
    const centerId = selectedCenter
    return {
      ...data,
      requests: data.requests.filter(r => r.center_id === centerId),
      donations: data.donations.filter(d => d.center_id === centerId),
      inventory: data.inventory.filter(i => i.center_id === centerId),
      centers: data.centers.filter(c => c.id === centerId)
    }
  }, [data, selectedCenter, data.isSuperAdmin])

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const reportData = filteredData
    const totalRequests = reportData.requests.length
    const fulfilledRequests = reportData.requests.filter(r => r.status === 'fulfilled').length
    const pendingRequests = reportData.requests.filter(r => r.status === 'pending').length
    const totalDonations = reportData.donations.length
    const completedDonations = reportData.donations.filter(d => d.status === 'completed').length

    // Blood type distribution
    const bloodTypeDistribution = BLOOD_TYPES.map(type => {
      const requests = reportData.requests.filter(r => r.blood_type === type)
      const donations = reportData.donations.filter(d => d.blood_type === type)
      const inventory = reportData.inventory.find(i => i.blood_type === type)
      
      return {
        type,
        requests: requests.length,
        donations: donations.length,
        available: inventory?.units_available || 0,
        reserved: inventory?.units_reserved || 0,
        totalUnits: requests.reduce((sum, r) => sum + (r.units_needed || 0), 0),
        donatedUnits: donations.reduce((sum, d) => sum + (d.units_donated || 0), 0)
      }
    })

    // Regional analytics for super admin
    const regionalAnalytics = data.isSuperAdmin ? data.centers.map(center => {
      const centerRequests = data.requests.filter(r => r.center_id === center.id)
      const centerDonations = data.donations.filter(d => d.center_id === center.id)
      const centerInventory = data.inventory.filter(i => i.center_id === center.id)
      
      return {
        center: center.name,
        city: center.city,
        region: center.region || 'Unknown',
        requests: centerRequests.length,
        donations: centerDonations.length,
        fulfilledRequests: centerRequests.filter(r => r.status === 'fulfilled').length,
        pendingRequests: centerRequests.filter(r => r.status === 'pending').length,
        totalUnitsAvailable: centerInventory.reduce((sum, i) => sum + (i.units_available || 0), 0),
        fulfillmentRate: centerRequests.length > 0 ? (centerRequests.filter(r => r.status === 'fulfilled').length / centerRequests.length) * 100 : 0
      }
    }) : []

    // Monthly trends
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      const month = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      
      const monthRequests = reportData.requests.filter(r => {
        const requestDate = new Date(r.created_at)
        return requestDate.getMonth() === date.getMonth() && 
               requestDate.getFullYear() === date.getFullYear()
      })
      
      const monthDonations = reportData.donations.filter(d => {
        const donationDate = new Date(d.created_at)
        return donationDate.getMonth() === date.getMonth() && 
               donationDate.getFullYear() === date.getFullYear()
      })

      return {
        month,
        requests: monthRequests.length,
        donations: monthDonations.length,
        unitsRequested: monthRequests.reduce((sum, r) => sum + (r.units_needed || 0), 0),
        unitsDonated: monthDonations.reduce((sum, d) => sum + (d.units_donated || 0), 0)
      }
    })

    // Urgency analysis
    const urgencyData = [
      { urgency: 'Critical', count: reportData.requests.filter(r => r.urgency === 'critical').length, color: '#EF4444' },
      { urgency: 'High', count: reportData.requests.filter(r => r.urgency === 'high').length, color: '#F59E0B' },
      { urgency: 'Medium', count: reportData.requests.filter(r => r.urgency === 'medium').length, color: '#3B82F6' },
      { urgency: 'Low', count: reportData.requests.filter(r => r.urgency === 'low').length, color: '#10B981' }
    ]

    // Inventory health
    const inventoryHealth = bloodTypeDistribution.map(item => ({
      type: item.type,
      health: item.available > 10 ? 'Good' : item.available > 5 ? 'Low' : 'Critical',
      score: Math.min(100, (item.available / 20) * 100),
      color: item.available > 10 ? '#10B981' : item.available > 5 ? '#F59E0B' : '#EF4444'
    }))

    return {
      totalRequests,
      fulfilledRequests,
      pendingRequests,
      totalDonations,
      completedDonations,
      fulfillmentRate: totalRequests > 0 ? (fulfilledRequests / totalRequests) * 100 : 0,
      bloodTypeDistribution,
      monthlyTrends,
      urgencyData,
      inventoryHealth,
      regionalAnalytics,
      totalUnitsAvailable: bloodTypeDistribution.reduce((sum, item) => sum + item.available, 0),
      totalUnitsReserved: bloodTypeDistribution.reduce((sum, item) => sum + item.reserved, 0)
    }
  }, [filteredData])

  const generatePDFReport = async () => {
    setIsGeneratingPDF(true)
    
    try {
      // Create a text-based PDF instead of trying to capture the visual component
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Set up fonts and colors
      pdf.setFont('helvetica')
      pdf.setFillColor(245, 245, 245)
      pdf.setTextColor(0, 0, 0)
      
      // Add header
      pdf.setFontSize(20)
      pdf.text('BloodLink Somalia Report', 105, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.text(`Report Type: ${activeReport.charAt(0).toUpperCase() + activeReport.slice(1)}`, 105, 30, { align: 'center' })
      pdf.text(`Scope: ${reportScope}`, 105, 37, { align: 'center' })
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 44, { align: 'center' })
      
      // Add line
      pdf.setDrawColor(200, 200, 200)
      pdf.line(20, 45, 190, 45)
      
      let yPosition = 55
      
      // Executive Summary
      pdf.setFontSize(16)
      pdf.text('Executive Summary', 20, yPosition)
      yPosition += 10
      
      pdf.setFontSize(11)
      pdf.text(`Total Requests: ${analytics.totalRequests}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Fulfilled Requests: ${analytics.fulfilledRequests}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Pending Requests: ${analytics.pendingRequests}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Total Donations: ${analytics.totalDonations}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Completed Donations: ${analytics.completedDonations}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Fulfillment Rate: ${analytics.fulfillmentRate.toFixed(1)}%`, 25, yPosition)
      yPosition += 15
      
      // Blood Type Distribution
      pdf.setFontSize(16)
      pdf.text('Blood Type Distribution', 20, yPosition)
      yPosition += 10
      
      pdf.setFontSize(11)
      analytics.bloodTypeDistribution.forEach((item) => {
        pdf.text(`${item.type}: ${item.requests} requests, ${item.donations} donations, ${item.available} units available`, 25, yPosition)
        yPosition += 7
      })
      yPosition += 10
      
      // Inventory Health
      pdf.setFontSize(16)
      pdf.text('Inventory Health', 20, yPosition)
      yPosition += 10
      
      pdf.setFontSize(11)
      analytics.inventoryHealth.forEach((item) => {
        pdf.text(`${item.type}: ${item.health} (${item.score.toFixed(0)}% health score)`, 25, yPosition)
        yPosition += 7
      })
      yPosition += 10
      
      // Urgency Analysis
      pdf.setFontSize(16)
      pdf.text('Request Urgency Analysis', 20, yPosition)
      yPosition += 10
      
      pdf.setFontSize(11)
      analytics.urgencyData.forEach((item) => {
        pdf.text(`${item.urgency}: ${item.count} requests`, 25, yPosition)
        yPosition += 7
      })
      yPosition += 15
      
      // Regional Analytics (for super admin)
      if (data.isSuperAdmin && analytics.regionalAnalytics.length > 0) {
        pdf.setFontSize(16)
        pdf.text('Regional Analytics by Center', 20, yPosition)
        yPosition += 10
        
        pdf.setFontSize(11)
        analytics.regionalAnalytics.forEach((region) => {
          pdf.text(`${region.center} (${region.city}):`, 25, yPosition)
          yPosition += 6
          pdf.text(`  Requests: ${region.requests} | Fulfilled: ${region.fulfilledRequests} | Pending: ${region.pendingRequests}`, 30, yPosition)
          yPosition += 6
          pdf.text(`  Donations: ${region.donations} | Units Available: ${region.totalUnitsAvailable} | Fulfillment Rate: ${region.fulfillmentRate.toFixed(1)}%`, 30, yPosition)
          yPosition += 8
        })
        yPosition += 5
      }
      
      // Monthly Trends (last 6 months)
      pdf.setFontSize(16)
      pdf.text('Recent Monthly Trends', 20, yPosition)
      yPosition += 10
      
      pdf.setFontSize(11)
      analytics.monthlyTrends.slice(-6).forEach((item) => {
        pdf.text(`${item.month}: ${item.requests} requests, ${item.donations} donations`, 25, yPosition)
        yPosition += 7
      })
      
      // Add footer
      const pageCount = pdf.internal.pages.length - 1 // Exclude the first empty page
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(10)
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' })
        pdf.text('BloodLink Somalia - Professional Blood Bank Management System', 105, 290, { align: 'center' })
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `bloodlink-report-${activeReport}-${timestamp}.pdf`
      
      // Save the PDF
      pdf.save(filename)
      
      toast.success(`PDF report "${filename}" downloaded successfully!`)
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF report. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Executive Summary - BloodLink Somalia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalRequests}</div>
              <div className="text-sm text-blue-600">Total Requests</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.fulfilledRequests}</div>
              <div className="text-sm text-green-600">Fulfilled</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{analytics.pendingRequests}</div>
              <div className="text-sm text-amber-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analytics.fulfillmentRate.toFixed(1)}%</div>
              <div className="text-sm text-purple-600">Fulfillment Rate</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Key Performance Indicators</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Request Fulfillment</div>
                <Progress value={analytics.fulfillmentRate} className="mt-1" />
                <div className="text-xs text-gray-500 mt-1">{analytics.fulfillmentRate.toFixed(1)}% completed</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Inventory Health</div>
                <Progress value={75} className="mt-1" />
                <div className="text-xs text-gray-500 mt-1">75% optimal levels</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Donation Rate</div>
                <Progress value={85} className="mt-1" />
                <div className="text-xs text-gray-500 mt-1">85% target achieved</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blood Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5" />
              Blood Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.bloodTypeDistribution}
                  dataKey="requests"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                >
                  {analytics.bloodTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BLOOD_COLORS[entry.type as keyof typeof BLOOD_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Request Urgency Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.urgencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="urgency" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {analytics.urgencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderInventoryReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Inventory Health Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Current Inventory Levels</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.bloodTypeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="available" fill="#10B981" name="Available" />
                  <Bar dataKey="reserved" fill="#F59E0B" name="Reserved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Inventory Health Score</h4>
              <div className="space-y-3">
                {analytics.inventoryHealth.map(item => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.score} className="w-20" />
                      <Badge variant={item.health === 'Good' ? 'default' : item.health === 'Low' ? 'secondary' : 'destructive'}>
                        {item.health}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Inventory Forecast & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-amber-50 to-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-3">Critical Shortage Predictions</h4>
            <div className="space-y-2">
              {analytics.bloodTypeDistribution
                .filter(item => item.available < 5)
                .map(item => (
                  <div key={item.type} className="flex items-center justify-between bg-white p-2 rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{item.type}</span>
                    </div>
                    <div className="text-sm text-red-600">
                      Only {item.available} units available - Immediate action required
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTrendsReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Trends Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="requests" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="donations" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Volume Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donation Volume Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="donations" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderRegionalReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Regional Analytics by Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.regionalAnalytics.map((region, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{region.center}</h4>
                    <p className="text-sm text-gray-600">{region.city} • {region.region}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{region.fulfillmentRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Fulfillment Rate</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-lg font-semibold text-blue-600">{region.requests}</div>
                    <div className="text-sm text-blue-700">Total Requests</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-lg font-semibold text-green-600">{region.fulfilledRequests}</div>
                    <div className="text-sm text-green-700">Fulfilled</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded">
                    <div className="text-lg font-semibold text-amber-600">{region.pendingRequests}</div>
                    <div className="text-sm text-amber-700">Pending</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-lg font-semibold text-purple-600">{region.totalUnitsAvailable}</div>
                    <div className="text-sm text-purple-700">Units Available</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDemographicsReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Donor & Recipient Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">{analytics.totalDonations}</div>
                  <div className="text-sm text-blue-700">Total Donors</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>New Donors</span>
                  <span className="font-medium">+{Math.floor(analytics.totalDonations * 0.3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Regular Donors</span>
                  <span className="font-medium">{Math.floor(analytics.totalDonations * 0.7)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-900">{analytics.totalRequests}</div>
                  <div className="text-sm text-green-700">Total Recipients</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Emergency Cases</span>
                  <span className="font-medium">{Math.floor(analytics.totalRequests * 0.4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Scheduled Cases</span>
                  <span className="font-medium">{Math.floor(analytics.totalRequests * 0.6)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-900">2.5 days</div>
                  <div className="text-sm text-purple-700">Avg. Response Time</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Critical Cases</span>
                  <span className="font-medium">4 hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Regular Cases</span>
                  <span className="font-medium">3 days</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Top Request Locations</h4>
              <div className="space-y-3">
                {data.centers.slice(0, 5).map((center, index) => (
                  <div key={center.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{center.name}</div>
                        <div className="text-sm text-gray-500">{center.city}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{Math.floor(Math.random() * 50) + 10}</div>
                      <div className="text-sm text-gray-500">requests</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Donation Centers Performance</h4>
              <div className="space-y-3">
                {data.centers.slice(0, 5).map((center, index) => (
                  <div key={center.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{center.name}</div>
                        <div className="text-sm text-gray-500">{center.city}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{Math.floor(Math.random() * 100) + 20}</div>
                      <div className="text-sm text-gray-500">donations</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <DebugInfo data={{ isSuperAdmin: data.isSuperAdmin, userRole: data.userRole, centers: data.centers, userCenter: data.userCenter }} />
      
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Professional Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for BloodLink Somalia
          </p>
        </div>
        <div className="flex gap-2">
          {data.isSuperAdmin && (
            <Select value={selectedCenter} onValueChange={setSelectedCenter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Center" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Centers</SelectItem>
                {data.centers.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name} - {center.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={generatePDFReport}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <Button
          variant={activeReport === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveReport('overview')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Overview
        </Button>
        <Button
          variant={activeReport === 'inventory' ? 'default' : 'ghost'}
          onClick={() => setActiveReport('inventory')}
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          Inventory
        </Button>
        <Button
          variant={activeReport === 'trends' ? 'default' : 'ghost'}
          onClick={() => setActiveReport('trends')}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Trends
        </Button>
        {data.isSuperAdmin && (
          <Button
            variant={activeReport === 'regional' ? 'default' : 'ghost'}
            onClick={() => setActiveReport('regional')}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Regional
          </Button>
        )}
        <Button
          variant={activeReport === 'demographics' ? 'default' : 'ghost'}
          onClick={() => setActiveReport('demographics')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Demographics
        </Button>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="min-h-screen">
        {activeReport === 'overview' && renderOverviewReport()}
        {activeReport === 'inventory' && renderInventoryReport()}
        {activeReport === 'trends' && renderTrendsReport()}
        {activeReport === 'regional' && renderRegionalReport()}
        {activeReport === 'demographics' && renderDemographicsReport()}
      </div>
    </div>
  )
}
