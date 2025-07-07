import { generateClient } from "aws-amplify/api";
import type { Schema } from "../amplify/data/resource.ts";
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
    Paper,
    Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from '@mui/icons-material/Add';

// Генерація клієнта Amplify API
const client = generateClient<Schema>({ authMode: 'identityPool' });

// Тип для стану редагованої кімнати, може бути частковим під час створення
type EditableEventTypeData = Partial<Schema["EventType"]["type"]> & { id?: string };

function EventPanel() {
    const [eventType, setEventType] = useState<Schema["EventType"]["type"][]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [currentEventType, setCurrentEventType] = useState<EditableEventTypeData | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, errors } = await client.models.EventType.list({});
            if (errors) {
                console.error("Помилка завантаження промптів:", errors);
                setError(`Помилка завантаження: ${errors[0].message}`);
                setEventType([]); // Очистити кімнати у разі помилки
            } else {
                setEventType(data || []);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Непередбачена помилка';
            setError(`Помилка завантаження: ${errorMessage}`);
            setEventType([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData().then();
    }, []);

    const handleOpenCreateDialog = () => {
        setCurrentEventType({
            title: "",
            textPrompt: "",
        });
        setIsDialogOpen(true);
    };

    // Обробник для відкриття діалогу редагування існуючої кімнати
    const handleOpenEditDialog = (eventType: Schema["EventType"]["type"]) => {
        setCurrentEventType({ ...eventType }); // Копіюємо дані кімнати для редагування
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setCurrentEventType(null);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!currentEventType) return;
        const { name, value } = event.target;
        setCurrentEventType(prev => ({ ...prev!, [name]: value }));
    };

    const handleSaveEventType = async () => {
        if (!currentEventType) {
            setError("Немає даних для збереження.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            if (currentEventType.id) {
                const { data, errors } = await client.models.EventType.update({
                    id: currentEventType.id,
                    title: currentEventType.title ?? "",
                    textPrompt: currentEventType.textPrompt ?? "",
                });
                if (errors) {
                    console.error("Помилка оновлення типу події:", errors);
                    setError(`Помилка оновлення: ${errors[0].message}`);
                } else if (!data) {
                    setError("Помилка оновлення: не отримано дані.");
                }
            } else { // Створення
                const eventToCreate = {
                    title: currentEventType.title ?? "",
                    textPrompt: currentEventType.textPrompt ?? "",
                };
                const { data, errors } = await client.models.EventType.create(eventToCreate);
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
    const deleteEventType = async (id: string) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цей тип?")) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { errors } = await client.models.EventType.delete({ id });
            if (errors) {
                console.error("Помилка видалення типу:", errors);
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

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        Типи подій
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateDialog}
                        disabled={loading}
                    >
                        Додати тип
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading && !eventType.length && ( // Показуємо завантажувач, якщо дані завантажуються і кімнат ще немає
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && !eventType.length && ( // Якщо завантаження завершено, але кімнат немає
                    <Typography variant="subtitle1" sx={{ textAlign: 'center', my: 3 }}>
                        Немає типів для відображення. Спробуйте додати.
                    </Typography>
                )}

                {eventType.length > 0 && (
                    <List>
                        {eventType.map((eventType) => (
                            <ListItem
                                key={eventType.id}
                                divider
                            >
                                <Box display="flex" flexDirection="column" width="100%">
                                    <ListItemText
                                        primary={`Назва: ${eventType.title || "-"}`}
                                        secondary={
                                            <>
                                                Промпт: {eventType.textPrompt}
                                            </>
                                        }
                                    />
                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                        <Button
                                            variant={'contained'}
                                            startIcon={<EditIcon />}
                                            aria-label="edit"
                                            onClick={() => handleOpenEditDialog(eventType)}
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
                                            onClick={() => deleteEventType(eventType.id)}
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
            {currentEventType && (
                <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                    <DialogTitle>{currentEventType.id ? "Редагувати тип" : "Створити тип"}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    name="title"
                                    label="Назва"
                                    fullWidth
                                    variant="outlined"
                                    value={currentEventType.title || ""}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    margin="dense"
                                    name="textPrompt"
                                    label="Промпт"
                                    multiline
                                    fullWidth
                                    variant="outlined"
                                    value={currentEventType.textPrompt || ""}
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
                        <Button onClick={handleSaveEventType} variant="contained" color="primary" disabled={loading}>
                            {loading ? <CircularProgress size={24}
                                color="inherit" /> : (currentEventType.id ? "Зберегти зміни" : "Створити")}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Container>
    );
}

export default EventPanel;