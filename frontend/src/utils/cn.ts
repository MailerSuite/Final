// Basic classnames utility with simple merging
export function cn(...inputs: Array<string | false | null | undefined>) {
    return inputs.filter(Boolean).join(' ')
}