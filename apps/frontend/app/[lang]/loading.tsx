import { Spinner } from "@heroui/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner color="primary" size="lg" />
    </div>
  );
}
