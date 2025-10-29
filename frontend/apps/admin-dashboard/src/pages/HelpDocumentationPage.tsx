import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Divider,
  Stack,
  Alert,
  AlertTitle,
  Link
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  Article as GuideIcon,
  PlayCircle as VideoIcon,
  Quiz as FaqIcon,
  Support as SupportIcon,
  School as TutorialIcon,
  ContactSupport as ContactIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  GetApp as DownloadIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  NewReleases as UpdateIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const HelpDocumentationPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const quickStartGuides = [
    {
      id: 1,
      title: 'Getting Started with CloudPOS',
      description: 'Complete setup guide for new users',
      duration: '10 min read',
      difficulty: 'Beginner',
      steps: [
        'Initial system setup and configuration',
        'Adding your first products',
        'Setting up payment methods',
        'Processing your first sale',
        'Viewing reports and analytics'
      ]
    },
    {
      id: 2,
      title: 'Product Management Basics',
      description: 'Learn to manage your product catalog effectively',
      duration: '15 min read',
      difficulty: 'Beginner',
      steps: [
        'Creating product categories',
        'Adding product information',
        'Setting up inventory tracking',
        'Managing product variations',
        'Bulk product operations'
      ]
    }
  ];

  const videoTutorials = [
    {
      id: 1,
      title: 'CloudPOS Overview',
      description: 'Complete overview of all CloudPOS features',
      duration: '12:45',
      views: '2.5K',
      category: 'Getting Started'
    },
    {
      id: 2,
      title: 'Setting Up Your Store',
      description: 'Step-by-step store configuration guide',
      duration: '8:30',
      views: '1.8K',
      category: 'Setup'
    }
  ];

  const faqCategories = [
    {
      category: 'General',
      questions: [
        {
          question: 'What is CloudPOS and how does it work?',
          answer: 'CloudPOS is a comprehensive point-of-sale system designed for retail businesses. It provides inventory management, sales processing, customer management, and detailed reporting in a cloud-based platform accessible from anywhere.'
        },
        {
          question: 'Is my data secure with CloudPOS?',
          answer: 'Yes, CloudPOS uses enterprise-grade security including SSL encryption, regular backups, and compliance with industry security standards. Your data is stored securely in the cloud with multiple redundancy measures.'
        }
      ]
    },
    {
      category: 'Product Management',
      questions: [
        {
          question: 'How do I add new products to my inventory?',
          answer: 'Navigate to Product Management > Add Product. Fill in the required information including name, SKU, price, and category. You can also import products in bulk using CSV files.'
        },
        {
          question: 'Can I manage product variations (size, color, etc.)?',
          answer: 'Yes, CloudPOS supports product variations. When creating a product, you can add multiple variants with different attributes, pricing, and stock levels.'
        }
      ]
    }
  ];

  const supportContacts = [
    {
      method: 'Live Chat',
      description: 'Real-time support chat',
      availability: '24/7',
      responseTime: 'Immediate',
      icon: <ChatIcon />
    },
    {
      method: 'Email Support',
      description: 'support@cloudpos.com',
      availability: '24/7',
      responseTime: '< 2 hours',
      icon: <EmailIcon />
    },
    {
      method: 'Phone Support',
      description: '+1 (555) 123-4567',
      availability: 'Mon-Fri 8AM-8PM EST',
      responseTime: 'Immediate',
      icon: <PhoneIcon />
    }
  ];

  const systemUpdates = [
    {
      version: 'v2.1.0',
      date: '2024-01-15',
      type: 'Feature Update',
      highlights: [
        'New mobile responsiveness features',
        'Enhanced data export capabilities',
        'Improved performance monitoring',
        'Updated security protocols'
      ]
    }
  ];

  const renderQuickStartTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Quick Start Guides
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Get up and running quickly with these step-by-step guides designed for new users.
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' } }}>
        {quickStartGuides.map((guide) => (
          <Card key={guide.id}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <GuideIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {guide.title}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip 
                      label={guide.difficulty} 
                      size="small" 
                      color={guide.difficulty === 'Beginner' ? 'success' : 'warning'} 
                    />
                    <Chip label={guide.duration} size="small" variant="outlined" />
                  </Box>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {guide.description}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                What you'll learn:
              </Typography>
              
              <List dense>
                {guide.steps.map((step, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          bgcolor: 'primary.main', 
                          color: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '0.75rem' 
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText 
                      primary={step} 
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                Start Guide
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Alert severity="info" sx={{ mt: 3 }}>
        <AlertTitle>Need Help Getting Started?</AlertTitle>
        <Typography variant="body2">
          Our customer success team is available to provide personalized onboarding assistance. 
          <Link href="#" sx={{ ml: 1 }}>Schedule a free consultation</Link>
        </Typography>
      </Alert>
    </Box>
  );

  const renderVideoTutorialsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Video Tutorials
        </Typography>
        <Button variant="outlined" startIcon={<BookmarkIcon />}>
          View Playlist
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' } }}>
        {videoTutorials.map((video) => (
          <Card key={video.id}>
            <Box 
              sx={{ 
                position: 'relative', 
                height: 180, 
                bgcolor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconButton 
                size="large"
                onClick={() => {
                  setSelectedVideo(video);
                  setVideoDialogOpen(true);
                }}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)'
                  }
                }}
              >
                <VideoIcon sx={{ fontSize: 48 }} />
              </IconButton>
              <Chip 
                label={video.duration}
                size="small"
                sx={{ 
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.8)',
                  color: 'white'
                }}
              />
            </Box>
            
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {video.title}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {video.description}
              </Typography>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip label={video.category} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {video.views} views
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <IconButton size="small">
                  <ThumbUpIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <ShareIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <BookmarkIcon fontSize="small" />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Video Dialog */}
      <Dialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedVideo?.title}
        </DialogTitle>
        <DialogContent>
          <Box 
            sx={{ 
              height: 400, 
              bgcolor: 'grey.900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            Video Player Placeholder
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            {selectedVideo?.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVideoDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained">
            Watch Full Series
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderFAQTab = () => (
    <Box>
      <Box display="flex" gap={2} mb={3}>
        <TextField
          fullWidth
          placeholder="Search frequently asked questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <Button variant="outlined" startIcon={<ContactIcon />}>
          Ask Question
        </Button>
      </Box>

      {faqCategories.map((category) => (
        <Card key={category.category} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              {category.category}
            </Typography>
            
            {category.questions.map((faq, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {faq.answer}
                  </Typography>
                  <Box display="flex" gap={1} mt={2}>
                    <IconButton size="small">
                      <ThumbUpIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <ThumbDownIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ ml: 'auto', alignSelf: 'center' }}>
                      Was this helpful?
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      ))}

      <Alert severity="info" sx={{ mt: 3 }}>
        <AlertTitle>Can't find what you're looking for?</AlertTitle>
        <Typography variant="body2">
          Contact our support team for personalized assistance or submit a new question to our FAQ database.
        </Typography>
      </Alert>
    </Box>
  );

  const renderSupportTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Contact Support
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Get help when you need it. Our support team is here to assist you.
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
        {supportContacts.map((contact) => (
          <Card key={contact.method}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                {contact.icon}
              </Avatar>
              
              <Typography variant="h6" gutterBottom>
                {contact.method}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {contact.description}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" display="block">
                  Availability: {contact.availability}
                </Typography>
                <Typography variant="caption" display="block">
                  Response Time: {contact.responseTime}
                </Typography>
              </Box>
              
              <Button variant="contained" fullWidth>
                Contact Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        System Status & Updates
      </Typography>

      {systemUpdates.map((update) => (
        <Card key={update.version} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <UpdateIcon color="primary" />
                <Typography variant="h6">
                  Version {update.version}
                </Typography>
                <Chip 
                  label={update.type} 
                  size="small" 
                  color={update.type === 'Feature Update' ? 'success' : 'info'} 
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {update.date}
              </Typography>
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Key Highlights:
            </Typography>
            
            <List dense>
              {update.highlights.map((highlight, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <StarIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={highlight} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}

      <Button variant="outlined" startIcon={<DownloadIcon />} fullWidth>
        View Complete Release Notes
      </Button>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <HelpIcon sx={{ mr: 2 }} />
        Help & Documentation
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            label="Quick Start" 
            icon={<TutorialIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Video Tutorials" 
            icon={<VideoIcon />}
            iconPosition="start"
          />
          <Tab 
            label="FAQ" 
            icon={<FaqIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Support" 
            icon={<SupportIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {renderQuickStartTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {renderVideoTutorialsTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {renderFAQTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {renderSupportTab()}
      </TabPanel>
    </Box>
  );
};

export default HelpDocumentationPage;