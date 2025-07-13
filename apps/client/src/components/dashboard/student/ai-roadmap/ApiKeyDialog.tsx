"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/lib/stores";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  disabled: boolean;
}

const ApiKeyDialog = ({ disabled }: Props) => {
  const [apiKey, setApiKey] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { setModelApiKey } = useUIStore((state: { setModelApiKey: any; }) => ({
    setModelApiKey: state.setModelApiKey,
  }));

  useEffect(() => {
    const existingCohereKey = localStorage.getItem("COHERE_API_KEY");
    if (!existingCohereKey) {
      localStorage.setItem("COHERE_API_KEY", "");
    }
    setApiKey(existingCohereKey || "");
  }, []);

  const setApiKeys = () => {
    localStorage.setItem("COHERE_API_KEY", apiKey);
  };

  const onSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiKeys();
    setModelApiKey(apiKey);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <KeyRound size={16} />
          <span className="ml-2 hidden md:inline">Add Key</span>
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Add your <span className="font-bold">COHERE</span> API Key.
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSave}>
            <div className="flex flex-row gap-x-2">
              <Input
                onChange={(e) => setApiKey(e.target.value)}
                value={apiKey}
              />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <DialogClose asChild>
                <Button type="submit">Save</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default ApiKeyDialog;
