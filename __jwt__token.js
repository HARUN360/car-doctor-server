// Make api secure 
// concept:
// 1. assing two tokens for each person (access token,refresh token)
// 2. token contains: user identification (email, role, etc) valid for a shorter duration
// 3. refresh token use: to recreate an access token that was expired
// 4. if refresh is invalid then logout the user

// jwt------json web token