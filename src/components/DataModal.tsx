/* "use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

interface DataModalProps<T extends Record<string, any>> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => void;
  title: string;
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  fields: {
    name: keyof T;
    label: string;
    type: "text" | "number" | "textarea" | "url";
    placeholder?: string;
  }[];
}

export function DataModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  onSubmit,
  title,
  schema,
  defaultValues,
  fields,
}: DataModalProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as T,
  });

  const handleSubmit = (data: T) => {
    onSubmit(data);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {fields.map((field) => (
              <FormField
                key={field.name as string}
                control={form.control}
                name={field.name as any}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      {field.type === "textarea" ? (
                        <Textarea
                          placeholder={field.placeholder}
                          {...formField}
                        />
                      ) : (
                        <Input
                          type={field.type}
                          placeholder={field.placeholder}
                          {...formField}
                          onChange={(e) => {
                            const value =
                              field.type === "number"
                                ? Number.parseFloat(e.target.value) || 0
                                : e.target.value;
                            formField.onChange(value);
                          }}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
 */