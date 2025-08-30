import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Bundle } from "@shared/schema";

interface BundleCardProps {
  bundle: Bundle;
}

export default function BundleCard({ bundle }: BundleCardProps) {
  const getGradientClass = (bundleId: string) => {
    switch (bundleId) {
      case "bundle2":
        return "bg-gradient-to-r from-barn-navy to-barn-red";
      case "bundle3":
        return "bg-gradient-to-r from-barn-red to-orange-500";
      default:
        return "bg-gradient-to-r from-barn-navy to-barn-red";
    }
  };

  const getButtonColor = (bundleId: string) => {
    return bundleId === "bundle3" ? "text-barn-red" : "text-barn-navy";
  };

  return (
    <Card className={`${getGradientClass(bundle.id)} text-white overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg font-semibold" data-testid={`text-bundle-name-${bundle.id}`}>
            {bundle.name}
          </h4>
          <span className="bg-white text-barn-navy px-3 py-1 rounded-full text-sm font-bold" data-testid={`text-bundle-rate-${bundle.id}`}>
            ${bundle.hourlyRate}/hr
          </span>
        </div>
        
        <p className="text-sm opacity-90 mb-3" data-testid={`text-bundle-description-${bundle.id}`}>
          {bundle.description}
        </p>
        
        {bundle.id === "bundle3" && (
          <div className="flex items-center mb-3">
            <i className="fas fa-star mr-1"></i>
            <span className="text-sm font-medium">Most Popular</span>
          </div>
        )}
        
        <Link href={`/booking?bundleId=${bundle.id}`}>
          <Button 
            className={`bg-white ${getButtonColor(bundle.id)} hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium w-full`}
            data-testid={`button-select-bundle-${bundle.id}`}
          >
            Select Bundle
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
