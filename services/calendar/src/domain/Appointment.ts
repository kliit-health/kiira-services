// aggregate root
export class Appointment {
    readonly id: AppointmentId;
    readonly type: AppointmentType;

    constructor(id: AppointmentId) {
        this.id = id;
        this.type = {
            id: "t123",
            displayName: "Mental Health",
            description: "",
            price: 1.23
        };
    }
}

export interface AppointmentBuilder {
    build(): Appointment;

    useDateTime(): AppointmentBuilder;
    withExpert(): AppointmentBuilder;
    withMember(): AppointmentBuilder;
}

export interface AppointmentRepository {
    add(appt: Appointment): Promise<void>;
    get(id: string): Promise<Appointment>;
    set(appt: Appointment): Promise<void>;
}

type AppointmentId = string;


export class AppointmentUuId {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    public static new(): AppointmentUuId {
        return new AppointmentUuId("ABC");
    }

    public toString(): string {
        return this.value;
    }
}

const createAppt = () => {
    const apptId = AppointmentUuId.new();
};

type AppointmentDate = {
    date: string | null;
    time: string | null;
};

type AppointmentType = {
    id: string;

    displayName: string;
    description?: string | null;

    price?: number | null;
};

type CreateAppointmentRequest = {};
type CreateAppointmentResponse = {
    success: boolean;
};

class CreateAppointment {
    readonly repository: AppointmentRepository | null;

    constructor(repository: AppointmentRepository | null) {
        this.repository = repository;
    }

    async handle(request: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
        return { success: true };
    }
}

const createAppointment = new CreateAppointment(null);
const createAppointmentResponse = createAppointment.handle({});