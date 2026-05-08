export type MockApplication = {
  title: string;
  company: string;
  status: "Applied" | "Pending" | "Interview Scheduled";
};

export const mockApplications: MockApplication[] = [
  { title: "Senior Shopify Engineer", company: "Northstar Retail", status: "Applied" },
  {
    title: "Shopify Plus Solutions Developer",
    company: "ScaleCart Agency",
    status: "Interview Scheduled",
  },
  { title: "Junior Theme Developer", company: "Pixel Loom", status: "Pending" },
];
