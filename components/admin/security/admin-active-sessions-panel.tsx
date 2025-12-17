"use client"

/**
 * Admin Active Sessions Component
 * 
 * Displays all active sessions within the tenant for admin monitoring
 * Location: Admin Panel → Security → Active Sessions
 * 
 * Features:
 * - View all user sessions in tenant
 * - Filter by device type, user
 * - Revoke suspicious sessions
 * - Export session data for audit
 * 
 * Security:
 * - Only accessible by super_admin and admin roles
 * - Tenant-isolated (cannot see other tenants)
 * - All actions are audit-logged
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/components/ui/use-toast';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  HelpCircle, 
  MapPin, 
  Clock, 
  Shield,
  Search,
  Download,
  AlertTriangle,
  Ban
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';

interface AdminSession {
  sessionId: string;
  jwtId: string;
  userId: string;
  userName: string;
  userEmail: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  country?: string;
  lastActiveAt: string;
  issuedAt: string;
  ipHashPartial?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function AdminActiveSessionsPanel() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<AdminSession | null>(null);
  const { toast } = useToast();

  // Fetch sessions with filters
  const fetchSessions = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (deviceFilter && deviceFilter !== 'all') {
        params.append('deviceType', deviceFilter);
      }

      const response = await fetch(`/api/sessions/admin?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load active sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(1);
  }, [deviceFilter]);

  // Filter sessions locally by search query
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.userName.toLowerCase().includes(query) ||
      session.userEmail.toLowerCase().includes(query) ||
      session.browser.toLowerCase().includes(query) ||
      session.os.toLowerCase().includes(query)
    );
  });

  // Revoke session
  const handleRevoke = async (session: AdminSession) => {
    setSessionToRevoke(session);
    setShowRevokeDialog(true);
  };

  const confirmRevoke = async () => {
    if (!sessionToRevoke) return;

    try {
      setRevoking(sessionToRevoke.jwtId);
      const response = await fetch('/api/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          jwtId: sessionToRevoke.jwtId,
          reason: 'admin_revoke'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      toast({
        title: "Session revoked",
        description: `${sessionToRevoke.userName}'s session has been terminated`,
      });

      fetchSessions(pagination.page);
    } catch (error) {
      console.error('Error revoking session:', error);
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
      setShowRevokeDialog(false);
      setSessionToRevoke(null);
    }
  };

  // Export sessions data
  const handleExport = () => {
    const csv = [
      ['User', 'Email', 'Device Type', 'Browser', 'OS', 'Country', 'Last Active', 'Signed In'].join(','),
      ...filteredSessions.map(s => [
        s.userName,
        s.userEmail,
        s.deviceType,
        s.browser,
        s.os,
        s.country || 'Unknown',
        new Date(s.lastActiveAt).toISOString(),
        new Date(s.issuedAt).toISOString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Session data has been downloaded",
    });
  };

  // Get device icon
  const getDeviceIcon = (deviceType: AdminSession['deviceType']) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Monitor all active sessions within your organization
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredSessions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, email, browser, or OS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Device Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No active sessions found
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Security</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session.sessionId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{session.userName}</div>
                            <div className="text-sm text-muted-foreground">
                              {session.userEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.deviceType)}
                            <div>
                              <div className="font-medium text-sm">
                                {session.browser}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {session.os}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.country ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {session.country}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(session.lastActiveAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.ipHashPartial && (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {session.ipHashPartial}
                            </code>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(session)}
                            disabled={revoking === session.jwtId}
                          >
                            {revoking === session.jwtId ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Revoking...
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Revoke
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredSessions.length} of {pagination.total} sessions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSessions(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSessions(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Revoke Session?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {sessionToRevoke && (
                <>
                  You're about to terminate the session for{' '}
                  <strong>{sessionToRevoke.userName}</strong> ({sessionToRevoke.userEmail})
                  <br />
                  <br />
                  Device: <strong>{sessionToRevoke.browser}</strong> on{' '}
                  <strong>{sessionToRevoke.os}</strong>
                  <br />
                  <br />
                  The user will need to sign in again. This action will be logged for audit purposes.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke} className="bg-destructive text-destructive-foreground">
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
