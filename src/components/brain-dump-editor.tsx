import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
});

type FormValues = z.infer<typeof formSchema>;

interface BrainDumpEditorProps {
  onSave: (content: string) => Promise<void>;
  isSubmitting: boolean;
  initialContent?: string;
}

export function BrainDumpEditor({ onSave, isSubmitting, initialContent = "" }: BrainDumpEditorProps) {
  const [isExpanded, setIsExpanded] = useState(!!initialContent);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: initialContent,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    await onSave(values.content);
    if (!initialContent) {
      form.reset({ content: "" });
      setIsExpanded(false);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  return (
    <Card className={cn(
      "transition-all duration-300",
      isExpanded ? "border-primary" : ""
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Brain Dump
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Capture your thoughts here... Click to expand."
                      className={cn(
                        "resize-none transition-all duration-300 focus:border-primary",
                        isExpanded ? "min-h-[200px]" : "min-h-[80px]"
                      )}
                      onFocus={handleFocus}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className={cn(
            "flex justify-between transition-opacity duration-300",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsExpanded(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}