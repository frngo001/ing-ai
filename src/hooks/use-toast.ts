import { toast } from 'sonner'

export { toast }

// Simple wrapper for sonner toast
export function useToast() {
    return {
        toast,
    }
}
