export default async function handler(req, res) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    if (!apiKey || !placeId) {
      return res.status(500).json({ error: "Missing environment variables" });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,rating,reviews,user_ratings_total,url&key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(500).json({
        error: data.error_message || "Google API error",
        status: data.status
      });
    }

    const result = data.result;

    const fiveStarReviews = (result.reviews || [])
      .filter((review) => review.rating === 5)
      .slice(0, 5)
      .map((review) => ({
        authorName: review.author_name,
        authorUrl: review.author_url,
        profilePhotoUrl: review.profile_photo_url,
        rating: review.rating,
        text: review.text,
        relativeTimeDescription: review.relative_time_description,
        time: review.time
      }));

    res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");

    return res.status(200).json({
      businessName: result.name,
      rating: result.rating,
      totalReviews: result.user_ratings_total,
      googleUrl: result.url,
      reviews: fiveStarReviews
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
