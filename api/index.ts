import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

import Trip from './models/trip';
import User from './models/user';

/* -------------------- App Setup -------------------- */
const app = express();
const port = 8000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* -------------------- MongoDB -------------------- */
mongoose


app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});


/* -------------------- JWT -------------------- */
const JWT_SECRET: string = crypto.randomBytes(64).toString('hex');

/* -------------------- Create Trip -------------------- */
app.post('/trip', async (req: Request, res: Response) => {
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
    res.status(201).json(trip);
  } catch (error: any) {
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

/* -------------------- Add Place to Trip -------------------- */
app.post('/trip/:tripId/addPlace', async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const { placeId } = req.body;

  const API_KEY = 'YOUR_GOOGLE_API_KEY';

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
    const response = await axios.get(url);
    const details = response.data.result;

    const placeData = {
      name: details.name,
      phoneNumber: details.formatted_phone_number,
      website: details.website,
      openingHours: details.opening_hours?.weekday_text,
      photos: details.photos?.map(
        (photo: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${API_KEY}`,
      ),
      reviews: details.reviews?.map((review: any) => ({
        authorName: review.author_name,
        rating: review.rating,
        text: review.text,
      })),
      types: details.types,
      formatted_address: details.formatted_address,
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
    res.status(500).json({ error: 'Failed to add place to trip' });
  }
});

/* -------------------- Itinerary -------------------- */
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

  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );

    const { sub, email, name, picture } = response.data;

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
