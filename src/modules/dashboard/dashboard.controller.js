import Charger from '../../models/Charger.js';
import Booking from '../../models/Booking.js';
import NetworkUptime from '../../models/NetworkUptime.js';

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Active Chargers (currently in use)
    const activeChargersCount = await Charger.countDocuments({ status: 'in_use' });

    // 2. Bookings Today
    const bookingsTodayCount = await Booking.countDocuments({
      booking_start: { $gte: today }
    });

    // 3. Energy Delivered (sum of estimated_units for completed bookings)
    const energyResult = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalEnergy: { $sum: '$estimated_units' } } }
    ]);
    const totalEnergyDelivered = energyResult.length > 0 ? energyResult[0].totalEnergy : 0;

    // 4. Network Uptime (computed from charger statuses)
    const totalChargers = await Charger.countDocuments({});
    const operationalChargers = await Charger.countDocuments({
      status: { $in: ['available', 'in_use'] }
    });
    const networkUptime = totalChargers > 0
      ? Math.round((operationalChargers / totalChargers) * 100)
      : 0;

    // 5. Recent Bookings (latest 6, with charger info)
    const recentBookings = await Booking.find()
      .populate('charger_id', 'charger_code make model')
      .sort({ booking_start: -1 })
      .limit(6);

    // 6. Uptime History (last 7 days from NetworkUptime collection)
    const uptimeHistory = await NetworkUptime.find()
      .sort({ date: -1 })
      .limit(7);

    res.json({
      activeChargers: activeChargersCount,
      bookingsToday: bookingsTodayCount,
      energyDelivered: Math.round(totalEnergyDelivered * 10) / 10,
      networkUptime,
      recentBookings,
      uptimeHistory: uptimeHistory.reverse()
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};
