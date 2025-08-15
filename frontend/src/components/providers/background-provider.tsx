import { ReactNode, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Settings } from "lucide-react";
import { backgrounds } from "@/lib/animations";

interface BgType {
  id: string;
  class: string;
}

const BacgroundProvider = ({ children }: { children: ReactNode }) => {
  const [selected, setSelected] = useState<BgType>(backgrounds[0]);
  return (
    <div
      className={`fixed min-h-screen w-full transition-all duration-500 ${selected.class}`}
    >
      <div className="absolute inset-0 backdrop-blur-sm bg-white/10 z-10" />
      <main className="relative z-50">{children}</main>
      <Sheet>
        <SheetTrigger className="absolute z-50 right-0 top-2/4" asChild>
          <Button className="backdrop-blur-sm bg-white/30 hover:bg-white/40">
            <Settings className="animate-spin text-xl" />
          </Button>
        </SheetTrigger>
        <SheetContent className="px-4 w-80 bg-transparent backdrop-blur-lg shadow-2xl">
          <SheetHeader className="px-0 text-xl">
            <SheetTitle>Theme Customizer</SheetTitle>
          </SheetHeader>
          <div className="border-t border-b py-4 text-lg">
            <h3>Gradient Background</h3>
          </div>

          <div className="grid grid-cols-3 gap-5 mx-auto">
            {backgrounds.map(background => (<Button onClick={() => setSelected(background)} key={background.id} className={`w-16 h-16 cursor-pointer rounded-md ${background.class}`}></Button>))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BacgroundProvider;
