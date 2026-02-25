import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { ExecutiveOverview } from './pages/ExecutiveOverview';
import { BoardSummary } from './pages/BoardSummary';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: () => (
      <Layout>
        <ExecutiveOverview />
      </Layout>
    ),
  },
  {
    path: '/board-summary',
    Component: () => (
      <Layout>
        <BoardSummary />
      </Layout>
    ),
  },
]);
