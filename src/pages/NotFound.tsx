import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="text-center px-4 max-w-md">
        <div className="flex justify-center mb-8 animate-bounce">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20"></div>
            <FileText className="w-20 h-20 text-blue-600 relative" />
          </div>
        </div>
        
        <h1 className="mb-2 text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          404
        </h1>
        <p className="mb-2 text-2xl font-semibold text-gray-900">Oops! Page Not Found</p>
        <p className="mb-8 text-gray-600">
          Sorry, the page you're looking for doesn't exist or has been moved. Let's get you back on track!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => navigate("/")} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
