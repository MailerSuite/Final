import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import AdvancedSettings, { AdvancedSettingsValues } from "./AdvancedSettings";

export interface SMTPServerValues extends AdvancedSettingsValues {
  server: string;
  port: number;
  email: string;
  password: string;
  security: "none" | "tls" | "ssl";
}

interface AddSMTPServerFormProps {
  loading?: boolean;
  onSubmit: (values: SMTPServerValues) => void;
  onCancel: () => void;
}

const defaultValues: SMTPServerValues = {
  server: "",
  port: 587,
  email: "",
  password: "",
  security: "none",
  retries: 3,
  retryDelay: 1000,
  connectionTimeout: 10,
  operationTimeout: 30,
};

const AddSMTPServerForm = ({ loading = false, onSubmit, onCancel }: AddSMTPServerFormProps) => {
  const [values, setValues] = useState<SMTPServerValues>(defaultValues);

  const handleChange = (
    field: keyof SMTPServerValues,
    value: string | number
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdvancedChange = (
    field: keyof AdvancedSettingsValues,
    value: number
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label htmlFor="server">Server</Label>
          <Input
            id="server"
            value={values.server}
            onChange={(e) => handleChange("server", e.target.value)}
            placeholder="smtp.example.com"
            required
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            type="number"
            min={1}
            value={values.port}
            onChange={(e) => handleChange("port", Number(e.target.value))}
            placeholder="587"
            required
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-3 col-span-2">
          <Label htmlFor="security">Security</Label>
          <Select
            value={values.security}
            onValueChange={(v) => handleChange("security", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="tls">TLS</SelectItem>
              <SelectItem value="ssl">SSL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AdvancedSettings
        values={values}
        onChange={handleAdvancedChange}
        disabled={loading}
      />

      <DialogFooter className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Account"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </DialogFooter>
    </form>
  );
};

export default AddSMTPServerForm;
