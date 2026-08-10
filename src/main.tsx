import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/index.css'
import { DemoProvider } from './demo/DemoContext'
import { AdminLayout, CreatorLayout, PublicLayout } from './components/layouts'
import {
  ApplyPage, HomePage, HowItWorksPage, LoginPage, OffersPage, PublicCampaignsPage, ReferralPage,
} from './pages/public'
import { PolicyPage } from './pages/policies'
import { EarnPage, FastStartPage, PlaybooksPage, MoneyGuidePage } from './pages/guides'
import {
  CreatorAcademy, CreatorAssets, CreatorCampaignDetail, CreatorCampaigns, CreatorCompliance,
  CreatorDashboard, CreatorEarnings, CreatorLinks, CreatorPayouts, CreatorProfile, CreatorRemix,
  CreatorShare, CreatorSubmissions,
} from './pages/creator'
import {
  AdminApplications, AdminAssets, AdminAudit, AdminCampaignDetail, AdminCampaigns,
  AdminCommissionRules, AdminCommissions, AdminCompliance, AdminConversions, AdminCreatorDetail,
  AdminCreators, AdminDashboard, AdminDiscountCodes, AdminFraud, AdminImports, AdminOffers,
  AdminPayouts, AdminSettings, AdminSubmissions,
} from './pages/admin'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/how-it-works', element: <HowItWorksPage /> },
      { path: '/offers', element: <OffersPage /> },
      { path: '/campaigns', element: <PublicCampaignsPage /> },
      { path: '/apply', element: <ApplyPage /> },
      { path: '/earn', element: <EarnPage /> },
      { path: '/policies/:policyKey', element: <PolicyPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/r/:partnerCode/:offerSlug', element: <ReferralPage /> },
    ],
  },
  {
    path: '/creator',
    element: <CreatorLayout />,
    children: [
      { path: 'dashboard', element: <CreatorDashboard /> },
      { path: 'campaigns', element: <CreatorCampaigns /> },
      { path: 'campaigns/:campaignId', element: <CreatorCampaignDetail /> },
      { path: 'assets', element: <CreatorAssets /> },
      { path: 'remix', element: <CreatorRemix /> },
      { path: 'links', element: <CreatorLinks /> },
      { path: 'share', element: <CreatorShare /> },
      { path: 'submissions', element: <CreatorSubmissions /> },
      { path: 'earnings', element: <CreatorEarnings /> },
      { path: 'payouts', element: <CreatorPayouts /> },
      { path: 'academy', element: <CreatorAcademy /> },
      { path: 'fast-start', element: <FastStartPage /> },
      { path: 'playbooks', element: <PlaybooksPage /> },
      { path: 'money', element: <MoneyGuidePage /> },
      { path: 'compliance', element: <CreatorCompliance /> },
      { path: 'profile', element: <CreatorProfile /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'applications', element: <AdminApplications /> },
      { path: 'creators', element: <AdminCreators /> },
      { path: 'creators/:creatorId', element: <AdminCreatorDetail /> },
      { path: 'offers', element: <AdminOffers /> },
      { path: 'commission-rules', element: <AdminCommissionRules /> },
      { path: 'campaigns', element: <AdminCampaigns /> },
      { path: 'campaigns/:campaignId', element: <AdminCampaignDetail /> },
      { path: 'assets', element: <AdminAssets /> },
      { path: 'submissions', element: <AdminSubmissions /> },
      { path: 'conversions', element: <AdminConversions /> },
      { path: 'commissions', element: <AdminCommissions /> },
      { path: 'payouts', element: <AdminPayouts /> },
      { path: 'imports', element: <AdminImports /> },
      { path: 'discount-codes', element: <AdminDiscountCodes /> },
      { path: 'fraud', element: <AdminFraud /> },
      { path: 'compliance', element: <AdminCompliance /> },
      { path: 'audit', element: <AdminAudit /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DemoProvider>
        <RouterProvider router={router} />
      </DemoProvider>
    </QueryClientProvider>
  </StrictMode>,
)
