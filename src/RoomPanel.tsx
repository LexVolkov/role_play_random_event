import { generateClient } from "aws-amplify/api";
import type { Schema } from "../amplify/data/resource.ts"; // Припустимо, цей шлях правильний
import React, { useEffect, useState } from "react";
import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
    Typography,
    Container,
    Box,
    CircularProgress,
    Alert,
    Checkbox,
    FormControlLabel,
    Paper,
    Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from '@mui/icons-material/Add';
import LaunchIcon from '@mui/icons-material/Launch';

const promptSystem = 'You are an experienced Game Master with a rich imagination, ' +
    'capable of creating exciting and large-scale stories for tabletop role-playing games.'
const promptWorld = 'Incredible absurd world'
const promptRules = "Don't write in a standard way, add creativity and a pinch of absurdity. " +
    "Write your answer in Ukrainian. " +
    "Use up to 50 words. " +
    "The result should be only the text of the answer, nothing more. " +
    "Don't use markup and emojis."


// Генерація клієнта Amplify API
const client = generateClient<Schema>({ authMode: 'identityPool' });

// Тип для стану редагованої кімнати, може бути частковим під час створення
type EditableRoomData = Partial<Schema["Room"]["type"]> & { id?: string };

function RoomPanel() {
    const [rooms, setRooms] = useState<Schema["Room"]["type"][]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false); // Стан завантаження
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    // Зберігаємо повний об'єкт кімнати для редагування, або порожній для створення
    const [currentRoom, setCurrentRoom] = useState<EditableRoomData | null>(null);

    // Функція для завантаження даних кімнат
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, errors } = await client.models.Room.list({});
            if (errors) {
                console.error("Помилка завантаження кімнат:", errors);
                setError(`Помилка завантаження: ${errors[0].message}`);
                setRooms([]); // Очистити кімнати у разі помилки
            } else {
                setRooms(data || []);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Непередбачена помилка';
            setError(`Помилка завантаження: ${errorMessage}`);
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    // Завантаження даних при монтуванні компонента
    useEffect(() => {
        loadData().then();
    }, []);

    // Обробник для відкриття діалогу створення нової кімнати
    const handleOpenCreateDialog = () => {
        setCurrentRoom({ // Початкові значення для нової кімнати
            open: false,
            password: "",
            mission: "",
            numberOfVariant: 1,
            model: "",
            promptSystem,
            promptWorld,
            promptRules,
            temperature: 2,
        });
        setIsDialogOpen(true);
    };

    // Обробник для відкриття діалогу редагування існуючої кімнати
    const handleOpenEditDialog = (room: Schema["Room"]["type"]) => {
        setCurrentRoom({ ...room }); // Копіюємо дані кімнати для редагування
        setIsDialogOpen(true);
    };

    // Обробник для закриття діалогу
    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setCurrentRoom(null); // Очищуємо поточну кімнату
    };

    // Обробник для зміни значень у формі редагування/створення
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!currentRoom) return;
        const { name, value, type } = event.target;

        if (type === "checkbox") {
            const { checked } = event.target as HTMLInputElement;
            setCurrentRoom(prev => ({ ...prev!, [name]: checked }));
        } else if (type === "number") {
            setCurrentRoom(prev => ({ ...prev!, [name]: parseInt(value, 10) || 0 }));
        } else {
            setCurrentRoom(prev => ({ ...prev!, [name]: value }));
        }
    };

    // Функція для збереження (створення або оновлення) кімнати
    const handleSaveRoom = async () => {
        if (!currentRoom) {
            setError("Немає даних для збереження.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            // Визначаємо, чи це створення нової кімнати чи оновлення існуючої
            if (currentRoom.id) { // Оновлення
                // Видаляємо поля, які не можна оновлювати напряму або є системними
                const { data, errors } = await client.models.Room.update({
                    id: currentRoom.id,
                    open: currentRoom.open ?? false,
                    password: currentRoom.password ?? "",
                    mission: currentRoom.mission ?? "",
                    numberOfVariant: currentRoom.numberOfVariant ?? 0,
                    model: currentRoom.model ?? "",
                    promptSystem: currentRoom.promptSystem ?? "",
                    promptWorld: currentRoom.promptWorld ?? "",
                    promptRules: currentRoom.promptRules ?? "",
                    temperature: (currentRoom.temperature ?? 1) > 2 ? 2 : currentRoom.temperature ?? 1,
                });
                if (errors) {
                    console.error("Помилка оновлення кімнати:", errors);
                    setError(`Помилка оновлення: ${errors[0].message}`);
                } else if (!data) {
                    setError("Помилка оновлення: не отримано дані.");
                }
            } else { // Створення
                // Переконуємося, що всі необхідні поля для створення є
                const roomToCreate = {
                    open: currentRoom.open ?? false,
                    password: currentRoom.password ?? "",
                    mission: currentRoom.mission ?? "",
                    numberOfVariant: currentRoom.numberOfVariant ?? 0,
                    model: currentRoom.model ?? "",
                    promptSystem: currentRoom.promptSystem ?? "",
                    promptWorld: currentRoom.promptWorld ?? "",
                    promptRules: currentRoom.promptRules ?? "",
                    temperature: (currentRoom.temperature ?? 1) > 2 ? 2 : currentRoom.temperature ?? 1,
                };
                const { data, errors } = await client.models.Room.create(roomToCreate);
                if (errors) {
                    console.error("Помилка створення кімнати:", errors);
                    setError(`Помилка створення: ${errors[0].message}`);
                } else if (!data) {
                    setError("Помилка створення: не отримано дані.");
                }
            }
            await loadData(); // Перезавантажуємо дані після успішної операції
            handleCloseDialog(); // Закриваємо діалог
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Непередбачена помилка';
            setError(`Помилка збереження: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Функція для видалення кімнати
    const deleteRoom = async (id: string) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цю кімнату?")) {
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const { data: room, errors: roomErrors } = await client.models.Room.get({ id }, { selectionSet: ["events.id"] });
            if (roomErrors) {
                console.error("Помилка видалення кімнати:", roomErrors);
                setError(`Помилка видалення: ${roomErrors[0].message}`);
                return;
            }
            if (!room) {
                setError("Кімната не знайдена");
                return;
            }
            const eventsIds = room.events.map((e) => e.id);
            let deleteEventsErrors: string = '';
            for (const eventId of eventsIds) {
                const { errors: currentDeleteErrors } = await client.models.RoomEvent.delete({ id: eventId });
                if (currentDeleteErrors) {
                    deleteEventsErrors = currentDeleteErrors[0].message;
                }
            }
            if (deleteEventsErrors) {
                console.error("Помилка видалення подій:", deleteEventsErrors);
                setError(`Помилка видалення: ${deleteEventsErrors}`);
            }


            const { errors } = await client.models.Room.delete({ id });
            if (errors) {
                console.error("Помилка видалення кімнати:", errors);
                setError(`Помилка видалення: ${errors[0].message}`);
            }
            await loadData(); // Перезавантажуємо дані
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Непередбачена помилка';
            setError(`Помилка видалення: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };
    // Відкриває кімнату у новому вікні (Пане Lex)
    const handleOpenRoom = (roomId: string) => {
        window.open(`/${roomId}`, '_blank');
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        Керування Кімнатами
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateDialog}
                        disabled={loading}
                    >
                        Додати кімнату
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading && !rooms.length && ( // Показуємо завантажувач, якщо дані завантажуються і кімнат ще немає
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && !rooms.length && ( // Якщо завантаження завершено, але кімнат немає
                    <Typography variant="subtitle1" sx={{ textAlign: 'center', my: 3 }}>
                        Немає кімнат для відображення. Спробуйте додати нову.
                    </Typography>
                )}

                {rooms.length > 0 && (
                    <List>
                        {rooms.map((room) => (
                            <ListItem
                                key={room.id}
                                divider
                            >
                                <Box display="flex" flexDirection="column" width="100%">
                                    {/* Пане Lex, виправлено відображення іконки запуску та тексту місії */}
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" justifyContent="left">
                                                <span>Місія: {room.mission || "Нема"}</span>
                                                <LaunchIcon
                                                    sx={{ ml: 2, cursor: 'pointer' }}

                                                />
                                            </Box>
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenRoom(room.id);
                                        }}
                                        secondary={
                                            <>
                                                Статус: {room.open ? "Відкрита" : "Закрита"}
                                            </>
                                        }
                                        sx={{ cursor: 'pointer', backgroundColor: 'background.paper', p: 2 }}
                                    />

                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                        <Button
                                            variant={'contained'}
                                            startIcon={<EditIcon />}
                                            aria-label="edit"
                                            onClick={() => handleOpenEditDialog(room)}
                                            disabled={loading}
                                            color="primary"
                                            sx={{ mr: 1 }}
                                        >
                                            Редагувати
                                        </Button>
                                        <Button
                                            variant={'contained'}
                                            startIcon={<DeleteIcon />}
                                            aria-label="delete"
                                            onClick={() => deleteRoom(room.id)}
                                            disabled={loading}
                                            color="error"
                                            sx={{ ml: 1 }}
                                        >
                                            Видалити
                                        </Button>
                                    </Box>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Діалогове вікно для створення/редагування кімнати */}
            {currentRoom && (
                <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                    <DialogTitle>{currentRoom.id ? "Редагувати кімнату" : "Створити нову кімнату"}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    name="mission"
                                    label="Назва місії (можна потім сгенерувати у кімнаті)"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={currentRoom.mission || ""}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    margin="dense"
                                    name="password"
                                    label="Пароль (необов'язково)"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={currentRoom.password || ""}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    margin="dense"
                                    name="model"
                                    label="Модель"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={currentRoom.model || ""}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    margin="dense"
                                    name="numberOfVariant"
                                    label="Кількість варіантів"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={currentRoom.numberOfVariant || 0}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>

                                <TextField
                                    margin="dense"
                                    name="temperature"
                                    label="Температруа (0.0 - 2.0)"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={currentRoom.temperature || 1}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}
                                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mt: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="open"
                                            checked={!!currentRoom.open}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    }
                                    label="Кімната відкрита"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    margin="dense"
                                    name="promptSystem"
                                    label="Системний промпт"
                                    type="text"
                                    multiline
                                    fullWidth
                                    value={currentRoom.promptSystem || ""}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    margin="dense"
                                    name="promptWorld"
                                    label="Опис світу"
                                    type="text"
                                    multiline
                                    fullWidth
                                    value={currentRoom.promptWorld || ""}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    margin="dense"
                                    name="promptRules"
                                    label="Правила генерації"
                                    type="text"
                                    multiline
                                    fullWidth
                                    value={currentRoom.promptRules || ""}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ pb: 2, pr: 2 }}>
                        <Button onClick={handleCloseDialog} color="secondary" disabled={loading}>
                            Скасувати
                        </Button>
                        <Button onClick={handleSaveRoom} variant="contained" color="primary" disabled={loading}>
                            {loading ? <CircularProgress size={24}
                                color="inherit" /> : (currentRoom.id ? "Зберегти зміни" : "Створити кімнату")}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Container>
    );
}

export default RoomPanel;