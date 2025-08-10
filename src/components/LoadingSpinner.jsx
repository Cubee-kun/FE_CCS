import { CircularProgress, Box } from '@mui/material';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
  </div>
);

export default LoadingSpinner;