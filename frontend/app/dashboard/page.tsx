"use client";

import { useState, useEffect } from "react";
import {
    Phone,
    Users,
    Calendar,
    Search,
    Video,
    PhoneCall,
    Filter,
    ArrowUpDown,
    Upload,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type Status = "waiting_reply" | "received_feedback" | "currently_calling";
type SortDirection = "asc" | "desc" | null;

interface Interaction {
    id: number;
    date: string;
    type: "call" | "email" | "meeting";
    duration?: string;
    summary: string;
    outcome: string;
}

interface Client {
    id: number;
    name: string;
    description: string;
    phone: string;
    email: string;
    lastContact: string;
    status: Status;
    interactions?: Interaction[];
}

// Mock data - replace with actual data from your backend
const clients: Client[] = [
    {
        id: 1,
        name: "John Smith",
        description: "Financial Advisory Services",
        phone: "+1 (555) 123-4567",
        email: "john@techsolutions.com",
        lastContact: "2024-03-15",
        status: "waiting_reply",
        interactions: [
            {
                id: 1,
                date: "2024-03-15",
                type: "call",
                duration: "15 minutes",
                summary: "Discussed investment portfolio optimization",
                outcome: "Client requested detailed proposal",
            },
            {
                id: 2,
                date: "2024-03-10",
                type: "email",
                summary: "Sent initial service offering details",
                outcome:
                    "Client expressed interest in financial planning services",
            },
        ],
    },
    {
        id: 2,
        name: "Sarah Johnson",
        description: "Marketing Consultation",
        phone: "+1 (555) 987-6543",
        email: "sarah@digitaldynamics.com",
        lastContact: "2024-03-14",
        status: "received_feedback",
        interactions: [
            {
                id: 1,
                date: "2024-03-14",
                type: "meeting",
                duration: "45 minutes",
                summary: "Reviewed marketing strategy proposal",
                outcome: "Client approved the proposed plan",
            },
        ],
    },
    {
        id: 3,
        name: "Michael Brown",
        description: "Software Development",
        phone: "+1 (555) 456-7890",
        email: "michael@innovatelabs.com",
        lastContact: "2024-03-16",
        status: "currently_calling",
        interactions: [
            {
                id: 1,
                date: "2024-03-16",
                type: "call",
                duration: "30 minutes",
                summary: "Technical requirements gathering",
                outcome: "In progress",
            },
        ],
    },
];

const statusConfig = {
    waiting_reply: {
        label: "Waiting Reply",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    },
    received_feedback: {
        label: "Received Feedback",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
    currently_calling: {
        label: "Currently Calling",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
};

export default function Dashboard() {
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [companyData, setCompanyData] = useState<{
        companyName: string;
        service: string;
        phone: string;
        agentName: string;
    } | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<Status[]>([]);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [selectedClientForHistory, setSelectedClientForHistory] =
        useState<Client | null>(null);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

    useEffect(() => {
        const storedData = localStorage.getItem("companyData");
        if (storedData) {
            setCompanyData(JSON.parse(storedData));
        }
    }, []);

    const toggleClientSelection = (clientId: number) => {
        setSelectedClients((prev) =>
            prev.includes(clientId)
                ? prev.filter((id) => id !== clientId)
                : [...prev, clientId]
        );
    };

    const getStatusCounts = () => {
        return clients.reduce((acc, client) => {
            acc[client.status] = (acc[client.status] || 0) + 1;
            return acc;
        }, {} as Record<Status, number>);
    };

    const statusCounts = getStatusCounts();

    const handleSort = () => {
        setSortDirection((prev) => {
            if (prev === null) return "asc";
            if (prev === "asc") return "desc";
            return null;
        });
    };

    const sortClients = (clientsToSort: Client[]) => {
        if (sortDirection === null) return clientsToSort;

        return [...clientsToSort].sort((a, b) => {
            const statusOrder = {
                currently_calling: 1,
                waiting_reply: 2,
                received_feedback: 3,
            };

            const comparison = statusOrder[a.status] - statusOrder[b.status];
            return sortDirection === "asc" ? comparison : -comparison;
        });
    };

    const filteredClients = sortClients(
        clients.filter((client) => {
            const matchesSearch =
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                client.phone.includes(searchTerm) ||
                client.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter.length === 0 ||
                statusFilter.includes(client.status);

            return matchesSearch && matchesStatus;
        })
    );

    const handleSchedule = async (
        type: "meet" | "zoom" | "phone" | "email"
    ) => {
        if (type === "email") {
            const selectedClientData = clients.filter((client) =>
                selectedClients.includes(client.id)
            );

            for (const client of selectedClientData) {
                try {
                    const response = await fetch(
                        "http://localhost:5001/send_email",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                to: client.email,
                                subject: "Follow-up from ReflectAI",
                                message: `Dear ${client.name},\n\nThank you for your interest in our services. We would like to follow up on our previous conversation regarding ${client.description}.\n\nBest regards,\nReflectAI Team`,
                                from_email: "customer@reflectai.dev",
                            }),
                        }
                    );

                    const result = await response.json();
                    if (result.status === "success") {
                        // Add a new interaction to track the email
                        const newInteraction = {
                            id: client.interactions
                                ? Math.max(
                                      ...client.interactions.map((i) => i.id)
                                  ) + 1
                                : 1,
                            date: new Date().toISOString().split("T")[0],
                            type: "email" as const,
                            summary: "Follow-up email sent",
                            outcome: "Pending response",
                        };

                        // Update the client's interactions and last contact
                        const clientIndex = clients.findIndex(
                            (c) => c.id === client.id
                        );
                        if (clientIndex !== -1) {
                            clients[clientIndex] = {
                                ...clients[clientIndex],
                                lastContact: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                status: "waiting_reply" as Status,
                                interactions: [
                                    ...(clients[clientIndex].interactions ||
                                        []),
                                    newInteraction,
                                ],
                            };
                        }
                    }
                } catch (error) {
                    console.error(
                        `Failed to send email to ${client.email}:`,
                        error
                    );
                }
            }
            setIsDialogOpen(false);
            return;
        }
        console.log(`Scheduling ${type} calls for clients:`, selectedClients);
        setIsDialogOpen(false);
    };

    const handleImport = () => {
        // Mock import functionality
        console.log("Importing database from file...");
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Phone className="h-6 w-6" />
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        {companyData?.companyName ||
                                            "AI Call System"}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {companyData?.service}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleImport}>
                                <Upload className="h-4 w-4 mr-2" />
                                Import Database
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                {Object.entries(statusCounts).map(
                                    ([status, count]) => (
                                        <div
                                            key={status}
                                            className="flex items-center space-x-2"
                                        >
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    statusConfig[
                                                        status as Status
                                                    ].color
                                                }
                                            >
                                                {
                                                    statusConfig[
                                                        status as Status
                                                    ].label
                                                }
                                                : {count}
                                            </Badge>
                                        </div>
                                    )
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Users className="h-5 w-5" />
                                <span className="text-sm text-muted-foreground">
                                    {clients.length} Total Clients
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Actions Bar */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 pl-9"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-auto"
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter Status
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {(Object.keys(statusConfig) as Status[]).map(
                                    (status) => (
                                        <DropdownMenuCheckboxItem
                                            key={status}
                                            checked={statusFilter.includes(
                                                status
                                            )}
                                            onCheckedChange={(checked) => {
                                                setStatusFilter((prev) =>
                                                    checked
                                                        ? [...prev, status]
                                                        : prev.filter(
                                                              (s) =>
                                                                  s !== status
                                                          )
                                                );
                                            }}
                                        >
                                            {statusConfig[status].label}
                                        </DropdownMenuCheckboxItem>
                                    )
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="space-x-2"
                                disabled={selectedClients.length === 0}
                            >
                                <Calendar className="h-4 w-4" />
                                <span>Schedule Calls</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Schedule AI Calls</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Selected clients: {selectedClients.length}
                                </p>
                                <div className="grid gap-4">
                                    <Card
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleSchedule("meet")}
                                    >
                                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                                            <Video className="h-4 w-4 mr-2" />
                                            <CardTitle className="text-base">
                                                Google Meet
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>
                                                Schedule video calls via Google
                                                Meet
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                    <Card
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleSchedule("zoom")}
                                    >
                                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                                            <Video className="h-4 w-4 mr-2" />
                                            <CardTitle className="text-base">
                                                Zoom
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>
                                                Schedule video calls via Zoom
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                    <Card
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleSchedule("phone")}
                                    >
                                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                                            <PhoneCall className="h-4 w-4 mr-2" />
                                            <CardTitle className="text-base">
                                                Phone Call
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>
                                                Schedule direct phone calls
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                    <Card
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleSchedule("email")}
                                    >
                                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                                            <Video className="h-4 w-4 mr-2" />
                                            <CardTitle className="text-base">
                                                Email
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>
                                                Send follow-up emails to
                                                selected clients
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Clients Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">Select</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Last Contact</TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-full flex items-center justify-between"
                                        onClick={handleSort}
                                    >
                                        Status
                                        <ArrowUpDown
                                            className={`ml-2 h-4 w-4 ${
                                                sortDirection
                                                    ? "opacity-100"
                                                    : "opacity-50"
                                            }`}
                                        />
                                    </Button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map((client) => (
                                <TableRow
                                    key={client.id}
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setSelectedClientForHistory(client);
                                        setIsHistoryDialogOpen(true);
                                    }}
                                >
                                    <TableCell
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedClients.includes(
                                                client.id
                                            )}
                                            onChange={() =>
                                                toggleClientSelection(client.id)
                                            }
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {client.name}
                                    </TableCell>
                                    <TableCell>{client.description}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>{client.lastContact}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={`${
                                                statusConfig[client.status]
                                                    .color
                                            }`}
                                        >
                                            {statusConfig[client.status].label}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Interaction History Dialog */}
                <Dialog
                    open={isHistoryDialogOpen}
                    onOpenChange={setIsHistoryDialogOpen}
                >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                Interaction History -{" "}
                                {selectedClientForHistory?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {selectedClientForHistory?.interactions?.map(
                                (interaction) => (
                                    <Card key={interaction.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">
                                                    {interaction.type
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        interaction.type.slice(
                                                            1
                                                        )}
                                                    {interaction.duration &&
                                                        ` - ${interaction.duration}`}
                                                </CardTitle>
                                                <span className="text-sm text-muted-foreground">
                                                    {interaction.date}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="font-medium">
                                                        Summary:{" "}
                                                    </span>
                                                    {interaction.summary}
                                                </div>
                                                <div>
                                                    <span className="font-medium">
                                                        Outcome:{" "}
                                                    </span>
                                                    {interaction.outcome}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            )}
                            {(!selectedClientForHistory?.interactions ||
                                selectedClientForHistory.interactions.length ===
                                    0) && (
                                <div className="text-center text-muted-foreground py-4">
                                    No interaction history available for this
                                    client.
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
