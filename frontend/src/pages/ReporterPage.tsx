import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  CalendarToday as CalendarIcon,
  Assessment as ReportIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  FitnessCenter as WorkoutIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useProfile } from '../contexts/ProfileContext';

interface ReportConfig {
  type: 'weekly' | 'monthly' | 'custom';
  sports: string[];
  includeCharts: boolean;
  includeProgress: boolean;
  includeGoals: boolean;
  format: 'pdf' | 'email';
}

const ReporterPage: React.FC = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'monthly',
    sports: ['basketball', 'football'],
    includeCharts: true,
    includeProgress: true,
    includeGoals: true,
    format: 'pdf'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { getProfileData } = useProfile();

  const handleSportChange = (sport: string, checked: boolean) => {
    if (checked) {
      setReportConfig(prev => ({
        ...prev,
        sports: [...prev.sports, sport]
      }));
    } else {
      setReportConfig(prev => ({
        ...prev,
        sports: prev.sports.filter(s => s !== sport)
      }));
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 2000);
  };

  // Calculate real report data
  const calculateReportData = () => {
    const sessions = getProfileData('sportsSessions') || [];
    const plannedWorkouts = getProfileData('plannedWorkouts') || [];
    
    // Filter by date range
    let filteredSessions = sessions;
    const now = new Date();
    
    if (reportConfig.type === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredSessions = sessions.filter((s: any) => new Date(s.date) >= weekAgo);
    } else if (reportConfig.type === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredSessions = sessions.filter((s: any) => new Date(s.date) >= monthAgo);
    }

    const basketballSessions = filteredSessions.filter((s: any) => s.sport === 'basketball');
    const footballSessions = filteredSessions.filter((s: any) => s.sport === 'football');
    
    const totalSessions = filteredSessions.length;
    const totalTime = filteredSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
    const avgQuality = totalSessions > 0 
      ? (filteredSessions.reduce((sum: number, s: any) => sum + (s.quality || 0), 0) / totalSessions).toFixed(1)
      : '0.0';
    
    // Calculate improvement (simplified)
    const recentSessions = filteredSessions.slice(-5);
    const olderSessions = filteredSessions.slice(0, -5);
    let improvement = '0%';
    if (olderSessions.length > 0 && recentSessions.length > 0) {
      const recentAvg = recentSessions.reduce((sum: number, s: any) => sum + (s.quality || 0), 0) / recentSessions.length;
      const olderAvg = olderSessions.reduce((sum: number, s: any) => sum + (s.quality || 0), 0) / olderSessions.length;
      const improvementPercent = Math.round((recentAvg - olderAvg) / olderAvg * 100);
      improvement = `${improvementPercent > 0 ? '+' : ''}${improvementPercent}%`;
    }

    const getTopSkills = (sportSessions: any[]) => {
      const skillCounts: { [key: string]: number } = {};
      sportSessions.forEach(s => {
        if (s.skills && Array.isArray(s.skills)) {
          s.skills.forEach((skill: string) => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        }
      });
      return Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([skill]) => skill);
    };

    const completedWorkouts = plannedWorkouts.filter((w: any) => w.isCompleted).length;
    
    return {
      title: `${reportConfig.type.charAt(0).toUpperCase() + reportConfig.type.slice(1)} Training Report`,
      period: reportConfig.type === 'weekly' ? 'Last 7 Days' : 'Last 30 Days',
      summary: {
        totalSessions,
        totalTime: `${totalTime} minutes`,
        avgQuality: `${avgQuality}/10`,
        improvement
      },
      sports: {
        basketball: {
          sessions: basketballSessions.length,
          time: basketballSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0),
          topSkills: getTopSkills(basketballSessions),
          improvement: basketballSessions.length > 0 ? improvement : '0%'
        },
        football: {
          sessions: footballSessions.length,
          time: footballSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0),
          topSkills: getTopSkills(footballSessions),
          improvement: footballSessions.length > 0 ? improvement : '0%'
        }
      },
      achievements: [
        totalSessions >= 7 ? `${totalSessions} Training Sessions` : null,
        filteredSessions.filter((s: any) => (s.quality || 0) >= 9).length >= 3 ? 'Quality Master (3+ sessions with 9+ rating)' : null,
        completedWorkouts > 0 ? 'Goal Achiever' : null
      ].filter(Boolean),
      goals: {
        completed: completedWorkouts,
        total: plannedWorkouts.length,
        details: plannedWorkouts.slice(0, 3).map((w: any) => ({
          goal: w.title || 'Workout Goal',
          status: w.isCompleted ? 'completed' : 'in-progress'
        }))
      }
    };
  };

  const reportPreview = calculateReportData();
  const hasData = (getProfileData('sportsSessions') || []).length > 0;

  // Generate recent reports from actual data
  const recentReports = useMemo(() => {
    if (!hasData) return [];
    
    const sessions = getProfileData('sportsSessions') || [];
    const reports = [];
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Add monthly report if data exists
    const sessionsThisMonth = sessions.filter((session: any) => {
      const sessionDate = new Date(session.date);
      return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
    });
    
    if (sessionsThisMonth.length > 0) {
      reports.push({
        name: `${currentMonth} Training Report`,
        date: now.toISOString().split('T')[0],
        type: 'Monthly',
        size: `${Math.max(1, Math.ceil(sessionsThisMonth.length * 0.3))} MB`
      });
    }
    
    // Add weekly report if recent sessions exist
    const lastWeekSessions = sessions.filter((session: any) => {
      const sessionDate = new Date(session.date);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    });
    
    if (lastWeekSessions.length > 0) {
      const weekNumber = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
      reports.push({
        name: `Weekly Progress - Week ${weekNumber}`,
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'Weekly',
        size: `${Math.max(1, Math.ceil(lastWeekSessions.length * 0.2))} MB`
      });
    }
    
    // Add sport-specific reports if enough data exists
    const basketballSessions = sessions.filter((s: any) => s.sport === 'basketball');
    if (basketballSessions.length > 5) {
      reports.push({
        name: 'Basketball Skills Analysis',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'Custom',
        size: `${Math.ceil(basketballSessions.length * 0.1)} MB`
      });
    }
    
    const footballSessions = sessions.filter((s: any) => s.sport === 'football');
    if (footballSessions.length > 5) {
      reports.push({
        name: 'Football Training Analysis',
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'Custom',
        size: `${Math.ceil(footballSessions.length * 0.1)} MB`
      });
    }
    
    return reports.slice(0, 4); // Limit to 4 most recent
  }, [hasData, getProfileData]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Progress Reporter
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Generate comprehensive training reports to track progress and share achievements
      </Typography>

      {!hasData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No training data available for reports. Start logging your basketball and football sessions in the Sports Training page to generate meaningful reports!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Report Configuration
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportConfig.type}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="weekly">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" />
                      Weekly Report
                    </Box>
                  </MenuItem>
                  <MenuItem value="monthly">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" />
                      Monthly Report
                    </Box>
                  </MenuItem>
                  <MenuItem value="custom">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReportIcon fontSize="small" />
                      Custom Report
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Sports to Include
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.sports.includes('basketball')}
                    onChange={(e) => handleSportChange('basketball', e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BasketballIcon fontSize="small" />
                    Basketball
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.sports.includes('football')}
                    onChange={(e) => handleSportChange('football', e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FootballIcon fontSize="small" />
                    Football
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.sports.includes('general')}
                    onChange={(e) => handleSportChange('general', e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkoutIcon fontSize="small" />
                    General Fitness
                  </Box>
                }
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Report Content
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.includeCharts}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  />
                }
                label="Include Charts & Graphs"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.includeProgress}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeProgress: e.target.checked }))}
                  />
                }
                label="Progress Analysis"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.includeGoals}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeGoals: e.target.checked }))}
                  />
                }
                label="Goals & Achievements"
              />

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Output Format</InputLabel>
                <Select
                  value={reportConfig.format}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value as any }))}
                >
                  <MenuItem value="pdf">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PdfIcon fontSize="small" />
                      PDF Document
                    </Box>
                  </MenuItem>
                  <MenuItem value="email">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      Email Report
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                startIcon={isGenerating ? <CircularProgress size={20} /> : <ReportIcon />}
                onClick={generateReport}
                disabled={isGenerating || reportConfig.sports.length === 0}
                sx={{ mt: 3 }}
              >
                {isGenerating ? 'Generating Report...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Report Preview */}
        <Grid item xs={12} md={6}>
          {showPreview ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PdfIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Report Preview
                </Typography>

                <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h5" gutterBottom>
                    {reportPreview.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {reportPreview.period}
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {reportPreview.summary.totalSessions}
                        </Typography>
                        <Typography variant="caption">Sessions</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {reportPreview.summary.improvement}
                        </Typography>
                        <Typography variant="caption">Improvement</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Sports Breakdown
                  </Typography>
                  {Object.entries(reportPreview.sports).map(([sport, data]) => (
                    <Box key={sport} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{sport.charAt(0).toUpperCase() + sport.slice(1)}:</strong> {data.sessions} sessions, {data.time} min
                      </Typography>
                    </Box>
                  ))}

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Recent Achievements
                  </Typography>
                  {reportPreview.achievements.map((achievement, index) => (
                    <Chip
                      key={index}
                      label={achievement}
                      size="small"
                      icon={<StarIcon />}
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Paper>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<PdfIcon />}
                    size="small"
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    size="small"
                  >
                    Email
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    size="small"
                  >
                    Share
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Report Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure your report settings and click "Generate Report" to see a preview
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Recent Reports */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Reports
              </Typography>
              {recentReports.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No reports generated yet. Generate your first report to see it here.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Report Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date Created</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentReports.map((report, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PdfIcon fontSize="small" />
                            {report.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={report.type} size="small" />
                        </TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>{report.size}</TableCell>
                        <TableCell>
                          <Button size="small" startIcon={<PdfIcon />}>
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReporterPage;
