
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import nodemailer from 'nodemailer';

import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';
import Trip from './models/TripModel';
import User from './models/user';

dotenv.config();

const LIVEKIT_API_KEY = 'APInzxJDarKowaG';
const LIVEKIT_API_SECRET = 'lZIzFwfi71e1utKlhDAVFhFxeOrOxikTF6QUTAaeC3BA';


/* -------------------- App Setup -------------------- */
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 8000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

server.on('error', (e: any) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Address in use, retrying...');
    setTimeout(() => {
      server.close();
      server.listen(port, '0.0.0.0');
    }, 1000);
  }
});


/* -------------------- JWT -------------------- */
const JWT_SECRET: string = crypto.randomBytes(64).toString('hex');

/* -------------------- Create Trip -------------------- */
app.post('/trip', async (req: Request, res: Response) => {
  console.log('Received POST /trip request');
  console.log('Body:', req.body);
  const { tripName, startDate, endDate, startDay, endDay, background, host, timezone } =
    req.body;

  try {
    const start = moment(startDate);
    const end = moment(endDate);

    const itinerary: { date: string; activities: any[] }[] = [];
    let currentDate = start.clone();

    while (currentDate.isSameOrBefore(end)) {
      itinerary.push({
        date: currentDate.format('YYYY-MM-DD'),
        activities: [],
      });
      currentDate.add(1, 'days');
    }

    const trip = new Trip({
      tripName,
      startDate: moment(startDate).format('DD MMMM YYYY'),
      endDate: moment(endDate).format('DD MMMM YYYY'),
      startDay,
      endDay,
      timezone,
      itinerary,
      background,
      host,
      travelers: [host],
    });

    await trip.save();
    console.log('Trip saved successfully:', trip);
    res.status(201).json(trip);
  } catch (error: any) {
    console.error('Error in POST /trip:', error);
    res.status(500).json({ message: error.message });
  }
});

/* -------------------- Get Trips -------------------- */
app.get('/trips/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const trips = await Trip.find({
      $or: [{ host: userId }, { travelers: userId }],
    }).populate('travelers', 'name email photo');

    res.status(200).json(trips);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/* -------------------- Delete Trip -------------------- */
app.delete('/trips/:tripId', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  try {
    const deletedTrip = await Trip.findByIdAndDelete(tripId);
    if (!deletedTrip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ message: 'Error deleting trip' });
  }
});

/* -------------------- Get Single Trip -------------------- */
app.get('/trip/:tripId', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Manual populate for travelers
    const travelers: any[] = [];
    if (trip.travelers && Array.isArray(trip.travelers)) {
      for (const travelerId of trip.travelers) {
        if (typeof travelerId === 'string') {
          const user = await User.findById(travelerId);
          if (user) {
            travelers.push({
              _id: user._id,
              name: user.data.name,
              email: user.data.email,
              photo: user.data.photo,
            });
          }
        } else {
          travelers.push(travelerId);
        }
      }
      trip.travelers = travelers;
    }

    res.status(200).json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ message: 'Error fetching trip' });
  }
});

/* -------------------- Add Place to Trip -------------------- */
app.post('/trip/:tripId/addPlace', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const { placeId } = req.body;

  const API_KEY = 'AIzaSyAaJ7VzIGk_y8dvrx2b4yya119jQVZJnNs';

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
    const response = await fetch(url);
    const data: any = await response.json();
    const details = data.result;

    const placeData = {
      name: details.name,
      phoneNumber: details.formatted_phone_number || '',
      website: details.website || '',
      openingHours: details.opening_hours?.weekday_text || [],
      photos: details.photos?.map(
        (photo: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${API_KEY}`,
      ) || [],
      reviews: details.reviews?.map((review: any) => ({
        authorName: review.author_name,
        rating: review.rating,
        text: review.text,
      })) || [],
      types: details.types || [],
      formatted_address: details.formatted_address || '',
      briefDescription:
        details.editorial_summary?.overview ||
        details.reviews?.[0]?.text ||
        'No description available',
      geometry: {
        location: {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
        },
        viewport: details.geometry.viewport,
      },
    };

    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      { $push: { placesToVisit: placeData } },
      { new: true },
    );

    res.status(200).json(updatedTrip);
  } catch (error) {
    console.error('Error in POST /trip/:tripId/addPlace:', error);
    res.status(500).json({ error: 'Failed to add place to trip' });
  }
});

/* -------------------- Remove Place from Trip -------------------- */
app.delete('/trip/:tripId/place', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const { placeName } = req.body; // Using name as identifier for now since places don't have unique IDs in current structure easily, or we can use whatever unique field we have. The frontend Logic uses name for selection.

  try {
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      { $pull: { placesToVisit: { name: placeName } } as any }, // Assuming name is unique enough for now
      { new: true },
    );

    if (!updatedTrip) return res.status(404).json({ message: 'Trip not found' });

    res.status(200).json(updatedTrip);
  } catch (error) {
    console.error('Error removing place:', error);
    res.status(500).json({ message: 'Failed to remove place' });
  }
});

/* -------------------- Get Places to Visit -------------------- */
app.get('/trip/:tripId/placesToVisit', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.status(200).json(trip.placesToVisit || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching places to visit' });
  }
});

/* -------------------- Itinerary -------------------- */
app.get('/trip/:tripId/itinerary', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.status(200).json(trip.itinerary || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching itinerary' });
  }
});

/* -------------------- Get User -------------------- */
app.get('/user/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
});

/* -------------------- LiveKit Token -------------------- */
app.get('/livekit/token', async (req: Request, res: Response) => {
  const roomName = req.query.roomName as string || 'default-room';
  const participantName = req.query.participantName as string || 'user';

  try {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
    });

    at.addGrant({ roomJoin: true, room: roomName });

    const token = await at.toJwt();
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ message: 'Error generating token' });
  }
});


app.post(
  '/trips/:tripId/itinerary/:date',
  async (req: Request, res: Response) => {
    const { tripId, date } = req.params;
    const newActivity = req.body;

    try {
      const updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        {
          $push: {
            'itinerary.$[entry].activities': newActivity,
          },
        },
        {
          new: true,
          arrayFilters: [{ 'entry.date': date }],
        },
      );

      if (!updatedTrip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      res.status(200).json(updatedTrip.itinerary);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },
);

/* -------------------- Google Login -------------------- */
app.post('/google-login', async (req: Request, res: Response) => {
  const { idToken } = req.body;
  console.log('Received POST /google-login request');

  try {
    console.log('Fetching token info...');
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );

    console.log('Token info fetched:', response);

    const data: any = await response.json();
    console.log('Token info data:', data);

    const { sub, email, name, picture } = data;

    let user = await User.findOne({ googleId: sub });

    if (!user) {
      user = new User({
        googleId: sub,
        email,
        name,
        photo: picture,
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: 'Google authentication failed' });
  }
});

/* -------------------- Email Signup -------------------- */
app.post('/email-signup', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  console.log('Received POST /email-signup request');

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    // Create new user
    const user = new User({
      googleId: '', // Empty for email users
      email,
      name,
      photo: '',
      password: hashedPassword,
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Email signup error:', error);
    res.status(500).json({ message: 'Email signup failed' });
  }
});

app.get('/', (req, res) => {
  res.status(200).send('Backend is running');
});

/* -------------------- Email Login -------------------- */
app.post('/email-login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log('Received POST /email-login request');
  console.log('Email:', email);

  try {
    // Find user by email
    console.log('Looking for user with email:', email);
    let user;
    try {
      user = await User.findOne({ email });
    } catch (dbError) {
      console.error('Database Error in User.findOne:', dbError);
      return res.status(500).json({ message: 'Database error' });
    }

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('Sending 401: User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Hash the provided password
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    console.log('Password hash matches:', user.data.password === hashedPassword);

    // Check if password matches
    if (user.data.password !== hashedPassword) {
      console.log('Sending 401: Password mismatch');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    console.log('Sending 200: Login successful');
    res.status(200).json({ user, token });
  } catch (error) {
    console.error('Email login error:', error);
    res.status(500).json({ message: 'Email login failed' });
  }
});


/* -------------------- Budget -------------------- */
app.put('/setBudget/:tripId', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const { budget } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.budget = budget;
    await trip.save();

    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Error updating budget' });
  }
});

/* -------------------- Expenses -------------------- */
app.post('/addExpense/:tripId', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const { category, price, paidBy, splitBy } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.expenses.push({ category, price, paidBy, splitBy });
    await trip.save();

    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Error adding expense' });
  }
});

app.get('/getExpenses/:tripId', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    res.status(200).json({ expenses: trip.expenses || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

/* -------------------- Email Invite -------------------- */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_app_password',
  },
});

app.post('/sendInviteEmail', async (req: Request, res: Response) => {
  const { email, tripId, tripName, senderName } = req.body;

  try {
    await transporter.sendMail({
      to: email,
      subject: `Invitation to join ${tripName}`,
      html: `<p>${senderName} invited you to join ${tripName}</p>`,
    });

    res.status(200).json({ message: 'Invitation sent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send email' });
  }
});
