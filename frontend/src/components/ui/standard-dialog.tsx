import * as React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";

export type StandardDialogAction = {
    label: string;
    onClick?: () => void;
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
    disabled?: boolean;
};

export interface StandardDialogProps {
    open: boolean;
    title: string;
    description?: string;
    children?: React.ReactNode;
    primaryAction?: StandardDialogAction;
    secondaryAction?: StandardDialogAction;
    onOpenChange: (open: boolean) => void;
    hideFooter?: boolean;
}

export function StandardDialog(props: StandardDialogProps) {
    const { open, onOpenChange, title, description, children, primaryAction, secondaryAction, hideFooter } = props;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>
                {children}
                {!hideFooter ? (
                    <DialogFooter>
                        {secondaryAction ? (
                            <Button
                                type="button"
                                variant={secondaryAction.variant ?? "secondary"}
                                onClick={secondaryAction.onClick}
                                disabled={secondaryAction.disabled}
                            >
                                {secondaryAction.label}
                            </Button>
                        ) : null}
                        {primaryAction ? (
                            <Button
                                type="button"
                                variant={primaryAction.variant ?? "default"}
                                onClick={primaryAction.onClick}
                                disabled={primaryAction.disabled}
                            >
                                {primaryAction.label}
                            </Button>
                        ) : null}
                    </DialogFooter>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

export default StandardDialog;


