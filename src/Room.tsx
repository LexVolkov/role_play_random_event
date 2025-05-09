import {useParams} from "react-router-dom";
import {generateClient} from "aws-amplify/api";
import type {Schema} from "../amplify/data/resource.ts"; // Припустимо, цей шлях правильний
import React, {useEffect, useState, FormEvent} from "react";
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Paper,
    Box,
    Divider, DialogTitle, DialogContent, Grid,  DialogActions, Dialog, LinearProgress,
} from "@mui/material";
import {formatDistanceToNowStrict} from 'date-fns';
import {uk} from 'date-fns/locale';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Генерація клієнта Amplify API
const client = generateClient<Schema>();

// Допоміжна функція для форматування відносного часу (як у месенджерах)
const formatRelativeTime = (dateString: string | undefined | null): string => {
    if (!dateString) {
        // Якщо дата відсутня, не відображаємо нічого або placeholder
        return '';
    }
    try {
        const date = new Date(dateString);
        // Перевірка на валідність дати
        if (isNaN(date.getTime())) {
            console.warn("Спроба форматувати некоректну дату:", dateString);
            return "Некоректна дата";
        }
        return formatDistanceToNowStrict(date, {addSuffix: true, locale: uk});
    } catch (e) {
        console.error("Помилка форматування дати:", dateString, e);
        return "Помилка дати";
    }
};

function Room() {
    const {id} = useParams<{ id: string }>(); // Отримуємо ID кімнати з URL
    const [room, setRoom] = useState<Schema["Room"]["type"] | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Стан завантаження даних кімнати
    const [loadingGenerate, setLoadingGenerate] = useState<boolean>(false); // Стан завантаження даних кімнати
    const [error, setError] = useState<string | null>(null); // Стан для загальних помилок
    const [events, setEvents] = useState<Schema["RoomEvent"]["type"][]>([]); // Список подій
    const [types, setTypes] = useState<Schema["EventType"]["type"][]>([]); // Список подій
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [randomTypes, setRandomTypes] = useState<Schema["EventType"]["type"][]>([]);
    const [expandedItems, setExpandedItems] = useState<{ [key: string | number]: boolean }>({});

    // Стани для обробки пароля
    const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(false);
    const [enteredPassword, setEnteredPassword] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Додатковий стан для відстеження, чи існує кімната (після запиту)
    const [roomExists, setRoomExists] = useState<boolean>(true);


    // Функція завантаження даних кімнати
    const loadRoomData = async () => {
        if (!id) {
            setError("ID кімнати не вказано в адресі.");
            setLoading(false);
            setRoomExists(false);
            return;
        }

        setLoading(true);
        setError(null);
        setRoom(null); // Очищуємо дані попередньої кімнати
        setIsPasswordVerified(false); // Скидаємо верифікацію пароля
        setEnteredPassword(""); // Очищуємо поле введеного пароля
        setPasswordError(null); // Скидаємо помилку пароля
        setRoomExists(true); // Припускаємо, що кімната існує до відповіді від сервера

        try {
            const {data, errors} = await client.models.Room.get({id});

            if (errors) {
                console.error("Помилка завантаження кімнати:", errors);
                const errorMessage = errors[0]?.message || "Невідома помилка GraphQL";
                setError(`Помилка завантаження кімнати: ${errorMessage}`);
                setRoom(null);
                setRoomExists(false);
            } else if (data) {
                setRoom(data);
                // Якщо у кімнати немає пароля, вважаємо її одразу верифікованою
                if (!data.password) {
                    setIsPasswordVerified(true);
                }
            } else {
                // data === null, але немає помилок, означає, що кімнату не знайдено
                setRoom(null);
                setRoomExists(false); // Кімнату не знайдено
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Непередбачена помилка при завантаженні кімнати.';
            console.error("Непередбачена помилка при завантаженні кімнати:", err);
            setError(`Помилка: ${errorMessage}`);
            setRoom(null);
            setRoomExists(false);
        } finally {
            setLoading(false);
        }
    };


    // Завантаження даних кімнати при першому рендері або зміні ID
    useEffect(() => {
        if (id) {
            loadRoomData().then();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);


    const loadTypesData = async () => {
        setLoading(true);
        setError(null);
        try {
            const {data, errors} = await client.models.EventType.list({});
            if (errors) {
                console.error("Помилка завантаження типів:", errors);
                setError(`Помилка завантаження: ${errors[0].message}`);
                setTypes([]); // Очистити кімнати у разі помилки
            } else {
                setTypes(data || []);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Непередбачена помилка';
            setError(`Помилка завантаження: ${errorMessage}`);
            setTypes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (room && room.id) {
            loadTypesData().then();
        }
    }, [room]);

    // Підписка на події кімнати (RoomEvent)
    useEffect(() => {
        // Підписуємось тільки якщо є ID кімнати і доступ дозволено (пароль верифіковано або його немає)
        if (!id || !isPasswordVerified || !room || !room.open) {
            setEvents([]); // Якщо немає доступу або ID, очищуємо список подій
            return; // Немає сенсу підписуватись
        }

        const subscription = client.models.RoomEvent.observeQuery({
            filter: {
                roomId: {
                    eq: id, // Фільтруємо події за ID поточної кімнати
                },
            },
            // Amplify DataStore v6 може не підтримувати sort напряму в observeQuery.
            // Сортування на клієнті після отримання даних надійніше.
        }).subscribe({
            next: ({items}) => {
                // Сортуємо події: найновіші спочатку (за полем createdAt)
                const sortedEvents = [...items].sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA; // Для сортування від новіших до старіших
                });
                setEvents(sortedEvents);
            },
            error: (subError) => {
                console.error("Помилка підписки на події кімнати:", subError);
                // Додаємо помилку підписки до загальних помилок або обробляємо окремо
                setError(prevError =>
                    prevError
                        ? `${prevError}\nПомилка завантаження подій: ${subError.message || 'невідома помилка підписки'}`
                        : `Помилка завантаження подій: ${subError.message || 'невідома помилка підписки'}`
                );
            }
        });

        // Функція для відписки при розмонтуванні компонента або зміні залежностей
        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isPasswordVerified]); // Залежності: ID кімнати та статус верифікації пароля

    // Обробник зміни значення в полі пароля
    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEnteredPassword(event.target.value);
        if (passwordError) {
            setPasswordError(null); // Скидаємо помилку при зміні вводу
        }
    };

    // Обробник відправки форми з паролем
    const handlePasswordSubmit = (event: FormEvent) => {
        event.preventDefault(); // Запобігаємо стандартній відправці форми
        if (room && room.password === enteredPassword) {
            setIsPasswordVerified(true);
            setPasswordError(null); // Пароль вірний, очищуємо помилку
        } else {
            setPasswordError("Неправильний пароль. Спробуйте ще раз.");
            setEnteredPassword(""); // Очистити поле для повторного вводу
        }
    };

    const toggleExpand = (id: string | number) => {
        setExpandedItems(prevState => ({
            ...prevState,
            [id]: !prevState[id],
        }));
    };

    // Рендеринг стану завантаження кімнати
    if (loading) {
        return (
            <Container sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress/>
                <Typography variant="h6" sx={{mt: 2}}>Завантаження даних кімнати...</Typography>
            </Container>
        );
    }

    // Рендеринг, якщо виникла загальна помилка
    if (error) {
        return (
            <Container sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    // Рендеринг, якщо ID кімнати не надано в URL
    if (!id) {
        return (
            <Container sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <Alert severity="warning">ID кімнати не вказано в адресі.</Alert>
            </Container>
        );
    }

    // Рендеринг, якщо кімнату не знайдено після запиту
    if (!roomExists) {
        return (
            <Container sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <Alert severity="warning">Кімнату з ID: "{id}" не знайдено.</Alert>
            </Container>
        );
    }

    if (room && !room.open) {
        return (
            <Container sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <Alert severity="warning">Ця кімната закрита.</Alert>
            </Container>
        );
    }

    // Рендеринг запиту пароля, якщо кімната завантажена, має пароль і він ще не верифікований
    if (room && room.password && !isPasswordVerified) {
        return (
            <Container maxWidth="sm" sx={{mt: 5}}>
                <Paper elevation={3} sx={{p: {xs: 2, sm: 4}, borderRadius: 2}}>
                    <Typography variant="h5" component="h1" gutterBottom sx={{textAlign: 'center'}}>
                        Доступ до кімнати
                    </Typography>
                    <Typography sx={{textAlign: 'center', color: 'text.secondary'}}>
                        Ця кімната захищена паролем. Будь ласка, введіть пароль для продовження.
                    </Typography>
                    <Box component="form" onSubmit={handlePasswordSubmit} noValidate sx={{mt: 1}}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Пароль"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={enteredPassword}
                            onChange={handlePasswordChange}
                            error={!!passwordError} // Показуємо помилку, якщо вона є
                            helperText={passwordError} // Текст помилки
                            autoFocus
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{mt: 3, mb: 2}}
                        >
                            Увійти
                        </Button>
                    </Box>
                </Paper>
            </Container>
        );
    }
    const handleGenerateMission = async () => {
        if (!room || !room.id) return;

        setLoading(true);

        const originPrompt = 'Your task is to generate a global mission for a group of characters. ' +
            'This mission should be significant enough to affect the entire game world or a significant part of it, ' +
            'and represent a long-term goal that requires many adventures and decisions. Generate in Ukrainian. ' +
            'The result should be only the text of the mission title, nothing more. Without unnecessary characters. ' +
            'Add creativity and a bit of absurdity. Don\'t write standard goals.';

        try {
            const {data, errors} = await client.queries.Generate({
                originPrompt: originPrompt,
            });

            console.log(data, errors)

            if (errors && errors?.length > 0) {
                console.error(errors[0].message);
                setError(errors[0].message || "Помилка при генерації відповіді.");
                return null;
            }

            if (!data || typeof data !== "string") {
                setError("Неправильна відповідь від сервера. Спробуйте ще раз.");
                return null;
            }

            const parsedData = JSON.parse(data);
            if (parsedData.error) {
                console.error(parsedData.body.error);
                setError("Помилка при генерації відповіді на сервері.");
                return null;
            }

            if (!parsedData.data || parsedData.data === '') {
                setError("Немає даних з сервера.");
                return null;
            }

            console.log(parsedData.data)

            const {data: updatedData, errors: updateErrors} = await client.models.Room.update({
                id: room.id,
                mission: parsedData.data ?? "",
            });
            if (updateErrors) {
                console.error("Помилка оновлення типу події:", updateErrors);
                setError(`Помилка оновлення: ${updateErrors[0].message}`);
            } else if (!updatedData) {
                setError("Помилка оновлення: не отримано дані.");
            }

            setRoom({...room, mission: parsedData.data});

        } catch (error) {
            console.error('Error generating mission:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleGenerate = async (type: Schema["EventType"]["type"] | null) => {
        if (!room || !room.id || !type) return;

        const originPrompt = type.textPrompt;

        setLoadingGenerate(true);

        try {
            const {data, errors} = await client.queries.Generate({
                originPrompt: originPrompt + "Don't write in a standard way, add creativity and a pinch of absurdity. " +
                    "Write your answer in Ukrainian. " +
                    "Use up to 50 words. " +
                    "The result should be only the text of the answer, nothing more.",
                model: room.model || null,
            });

            console.log(data, errors)

            if (errors && errors?.length > 0) {
                console.error(errors[0].message);
                setError(errors[0].message || "Помилка при генерації відповіді.");
                return null;
            }

            if (!data || typeof data !== "string") {
                setError("Неправильна відповідь від сервера. Спробуйте ще раз.");
                return null;
            }

            const parsedData = JSON.parse(data);
            if (parsedData.error) {
                console.error(parsedData.body.error);
                setError("Помилка при генерації відповіді на сервері.");
                return null;
            }

            if (!parsedData.data || parsedData.data === '') {
                setError("Немає даних з сервера.");
                return null;
            }

            console.log(parsedData.data)

            const {data: updatedData, errors: updateErrors} = await client.models.RoomEvent.create({
                event: parsedData.data,
                roomId: room.id,
                typeId: type.id
            });
            if (updateErrors) {
                console.error("Помилка додавання події:", updateErrors);
                setError(`Помилка оновлення: ${updateErrors[0].message}`);
            } else if (!updatedData) {
                setError("Помилка оновлення: не отримано дані.");
            }

        } catch (error) {
            console.error('Error generating:', error);
            setError("Помилка Генерації.");
        } finally {
            setLoadingGenerate(false);
            setIsDialogOpen(false);
            setRandomTypes([]);
        }
    };
    const handleOpenGenerateDialog = () => {
        if (randomTypes.length === 0) {
            const max = room?.numberOfVariant || 1;
            const shuffledTypes = [...types].sort(() => Math.random() - 0.5);
            const randomEventType = shuffledTypes.slice(0, max);
            setRandomTypes(randomEventType);
        }
        setIsDialogOpen(true);
    };

    // Рендеринг основного контенту кімнати, якщо доступ дозволено
    if (room && isPasswordVerified) {
        return (
            <>
                <Container maxWidth="md" sx={{mt: 4, mb: 4}}>
                    <Paper elevation={2} sx={{p: {xs: 2, md: 3}, borderRadius: 2}}>
                        <Typography variant="h6" component="h1" gutterBottom
                                    sx={{textAlign: 'center', mb: 3, fontWeight: 'medium'}}>
                            Головна мета: {room.mission ? `"${room.mission}"` : <Button
                            variant={'contained'}
                            startIcon={<AutoAwesomeIcon/>}
                            aria-label="edit"
                            onClick={() => handleGenerateMission()}
                            disabled={loading}
                            color="primary"
                        >
                            Визначити
                        </Button>}
                        </Typography>

                        <Divider sx={{my: 1}}/>
                        <Button
                            variant={'contained'}
                            startIcon={<AutoFixHighIcon/>}
                            aria-label="edit"
                            onClick={() => handleOpenGenerateDialog()}
                            disabled={loading}
                            fullWidth
                            color="primary"
                            sx={{p: 2}}
                        >
                            Нова подія
                        </Button>
                        <Divider sx={{my: 1}}/>

                        {events.length > 0 && (
                            <Box sx={{ mb: 4 }}> {/* Додаємо відступ знизу */}
                                <Typography variant="h5" component="h2" gutterBottom>
                                    Поточна подія:
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{xs: 12}}>
                                        <Typography variant="body1" component="p" sx={{ fontWeight: 'bold' }}> {/* Жирний текст для значення */}
                                            {types.find(type => type.id === events[0]?.typeId)?.title || 'Невідомий тип'} {/* Змінив 'error' на більш інформативний текст */}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{xs: 12}} sx={{width: '100%', bgcolor: 'background.paper', p: 3}}>
                                        <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>
                                            {events[0].event}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        <Typography variant="h5" component="h2" gutterBottom>
                            Історія подій:
                        </Typography>
                        {events.length > 0 ? (
                            <List sx={{ width: '100%'}}>
                                {events.slice(1).map((eventItem: Schema["RoomEvent"]["type"]) => { // Явно вказуємо тип для eventItem
                                    const isExpanded: boolean = expandedItems[eventItem.id]; // Явно вказуємо тип для isExpanded

                                    return (
                                        <ListItem
                                            key={eventItem.id}
                                            alignItems="flex-start"
                                            divider
                                            sx={{
                                                py: 1.5,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                cursor: 'pointer',
                                                bgcolor: 'background.paper'
                                            }}
                                            onClick={() => toggleExpand(eventItem.id)}
                                        >
                                            <ListItemText
                                                primary={types.find((type: Schema["EventType"]["type"]) => type.id === eventItem.typeId)?.title || 'error'} // Явно вказуємо тип для type

                                            />
                                            <Box
                                                component="div"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: isExpanded ? 'unset' : 1,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maskImage: isExpanded
                                                        ? 'none'
                                                        : 'linear-gradient(to bottom, black 60%, transparent 100%)',

                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    color="text.secondary"
                                                    sx={{ alignSelf: 'flex-end', mt: 0.5 }}
                                                >
                                                    {eventItem.event}
                                                </Typography>

                                            </Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ alignSelf: 'flex-end', mt: 0.5 }}
                                            >
                                                {/* Припустимо, formatRelativeTime приймає string або Date і повертає string */}
                                                {formatRelativeTime(eventItem.createdAt)}
                                            </Typography>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        ) : (
                            <Typography sx={{mt: 2, textAlign: 'center', color: 'text.secondary'}}>
                                Подій у цій кімнаті ще не відбулося.
                            </Typography>
                        )}
                    </Paper>
                </Container>

                <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>{loadingGenerate ? 'Зачекайте...' : 'Оберіть тип'}</DialogTitle>
                    <DialogContent>
                        {loadingGenerate ? <LinearProgress/> :
                            <Grid container spacing={2} sx={{mt: 1}}>

                                {randomTypes.map((type: Schema["EventType"]["type"]) => (
                                    <Grid key={type.id}>
                                        <Button
                                            size={'large'}
                                            onClick={() => handleGenerate(type || null)}
                                            variant="contained"
                                            color="primary"
                                            disabled={loading}
                                            sx={{p: 3}}
                                        >
                                            {type.title}
                                        </Button>
                                    </Grid>
                                ))}

                            </Grid>}

                    </DialogContent>
                    <DialogActions sx={{pb: 2, pr: 2}}>
                        <Button onClick={() => setIsDialogOpen(false)} color="secondary" disabled={loading}>
                            Скасувати
                        </Button>
                    </DialogActions>
                </Dialog>

            </>
        );
    }

    // Запасний рендеринг, якщо жодна з умов не виконана (малоймовірно)
    return (
        <Container sx={{mt: 4}}>
            <Alert severity="info">Завантаження інформації про кімнату або непередбачений стан.</Alert>
        </Container>
    );
}

export default Room;