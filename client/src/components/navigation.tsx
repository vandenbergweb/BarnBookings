import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface NavigationProps {
  currentPage: "home" | "book" | "bookings" | "profile";
}

export default function Navigation({ currentPage }: NavigationProps) {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'admin';
  
  const getButtonClass = (page: string) => {
    return currentPage === page 
      ? "text-barn-red" 
      : "text-barn-gray hover:text-barn-red";
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-sm w-full bg-white border-t border-gray-200 z-30">
      <div className={`flex ${isAdmin ? 'justify-between' : 'justify-around'} py-2 px-2`}>
        <Link href="/">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center py-2 px-4 ${getButtonClass("home")}`}
            data-testid="nav-home"
          >
            <i className="fas fa-home text-lg mb-1"></i>
            <span className="text-xs font-medium">Home</span>
          </Button>
        </Link>
        
        <Link href="/booking">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center py-2 px-4 ${getButtonClass("book")}`}
            data-testid="nav-book"
          >
            <i className="fas fa-calendar-plus text-lg mb-1"></i>
            <span className="text-xs font-medium">Book</span>
          </Button>
        </Link>
        
        <Link href="/dashboard">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center py-2 px-4 ${getButtonClass("bookings")}`}
            data-testid="nav-bookings"
          >
            <i className="fas fa-clipboard-list text-lg mb-1"></i>
            <span className="text-xs font-medium">Bookings</span>
          </Button>
        </Link>
        
        {isAdmin && (
          <Link href="/admin">
            <Button 
              variant="ghost" 
              className={`flex flex-col items-center py-2 px-2 ${getButtonClass("admin")}`}
              data-testid="nav-admin"
            >
              <i className="fas fa-user-shield text-lg mb-1"></i>
              <span className="text-xs font-medium">Admin</span>
            </Button>
          </Link>
        )}
        
        <Link href="/profile">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center py-2 px-2 ${getButtonClass("profile")}`}
            data-testid="nav-profile"
          >
            <i className="fas fa-user text-lg mb-1"></i>
            <span className="text-xs font-medium">Profile</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}
