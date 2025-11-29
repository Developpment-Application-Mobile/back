# Gift System API Endpoints - Android Implementation Guide

## 🎯 Overview
This guide provides detailed information about the three main gift-related endpoints and how to implement them in your Android app.

---

## 📍 API Endpoints

### Base URL
```
http://your-backend-url:3000
```

---

## 1️⃣ CREATE GIFT (Parent Only)

### Endpoint
```http
POST /parents/{parentId}/kids/{kidId}/gifts
```

### Description
Allows a parent to create a new gift in a specific child's gift catalog. Each child has their own separate catalog.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `parentId` | String | The ID of the parent |
| `kidId` | String | The ID of the child |

### Request Body
```json
{
  "title": "Lego Star Wars Set",
  "cost": 500
}
```

### Request Body Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Name of the gift |
| `cost` | Number | Yes | Cost in points |

### Success Response (201 Created)
```json
{
  "_id": "674a5b2c8f1e4d3a2b1c9d8e",
  "title": "Lego Star Wars Set",
  "cost": 500
}
```

### Error Responses

**404 Not Found - Parent Not Found:**
```json
{
  "statusCode": 404,
  "message": "Parent not found"
}
```

**404 Not Found - Child Not Found:**
```json
{
  "statusCode": 404,
  "message": "Child not found"
}
```

### Android Implementation

#### 1. API Service Interface
```kotlin
interface ParentApiService {
    @POST("parents/{parentId}/kids/{kidId}/gifts")
    suspend fun createGift(
        @Path("parentId") parentId: String,
        @Path("kidId") kidId: String,
        @Body giftRequest: CreateGiftRequest
    ): Gift
}

data class CreateGiftRequest(
    val title: String,
    val cost: Int
)

data class Gift(
    val _id: String,
    val title: String,
    val cost: Int
)
```

#### 2. Repository
```kotlin
class GiftRepository(private val apiService: ParentApiService) {
    
    suspend fun createGift(
        parentId: String,
        kidId: String,
        title: String,
        cost: Int
    ): Result<Gift> {
        return try {
            val request = CreateGiftRequest(title, cost)
            val gift = apiService.createGift(parentId, kidId, request)
            Result.success(gift)
        } catch (e: HttpException) {
            when (e.code()) {
                404 -> Result.failure(Exception("Parent or child not found"))
                else -> Result.failure(Exception("Failed to create gift"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

#### 3. ViewModel
```kotlin
class ParentGiftViewModel(
    private val repository: GiftRepository
) : ViewModel() {
    
    private val _createGiftState = MutableStateFlow<UiState<Gift>>(UiState.Idle)
    val createGiftState: StateFlow<UiState<Gift>> = _createGiftState
    
    fun createGift(parentId: String, kidId: String, title: String, cost: Int) {
        viewModelScope.launch {
            _createGiftState.value = UiState.Loading
            
            val result = repository.createGift(parentId, kidId, title, cost)
            
            _createGiftState.value = if (result.isSuccess) {
                UiState.Success(result.getOrNull()!!)
            } else {
                UiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }
}

sealed class UiState<out T> {
    object Idle : UiState<Nothing>()
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}
```

#### 4. UI (Jetpack Compose)
```kotlin
@Composable
fun CreateGiftDialog(
    parentId: String,
    kidId: String,
    viewModel: ParentGiftViewModel,
    onDismiss: () -> Unit,
    onSuccess: () -> Unit
) {
    var title by remember { mutableStateOf("") }
    var cost by remember { mutableStateOf("") }
    val createGiftState by viewModel.createGiftState.collectAsState()
    
    LaunchedEffect(createGiftState) {
        if (createGiftState is UiState.Success) {
            onSuccess()
            onDismiss()
        }
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create New Gift") },
        text = {
            Column {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Gift Title") },
                    placeholder = { Text("e.g., Lego Set") }
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = cost,
                    onValueChange = { cost = it.filter { char -> char.isDigit() } },
                    label = { Text("Cost (points)") },
                    placeholder = { Text("e.g., 500") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                
                if (createGiftState is UiState.Error) {
                    Text(
                        text = (createGiftState as UiState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank() && cost.isNotBlank()) {
                        viewModel.createGift(parentId, kidId, title, cost.toInt())
                    }
                },
                enabled = createGiftState !is UiState.Loading && 
                         title.isNotBlank() && 
                         cost.isNotBlank()
            ) {
                if (createGiftState is UiState.Loading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp))
                } else {
                    Text("Create")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
```

---

## 2️⃣ DELETE GIFT (Parent Only)

### Endpoint
```http
DELETE /parents/{parentId}/kids/{kidId}/gifts/{giftId}
```

### Description
Allows a parent to delete a gift from a specific child's gift catalog.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `parentId` | String | The ID of the parent |
| `kidId` | String | The ID of the child |
| `giftId` | String | The ID of the gift to delete |

### Success Response (200 OK)
```json
{
  "message": "Gift deleted successfully"
}
```

### Error Responses

**404 Not Found - Parent Not Found:**
```json
{
  "statusCode": 404,
  "message": "Parent not found"
}
```

**404 Not Found - Child Not Found:**
```json
{
  "statusCode": 404,
  "message": "Child not found"
}
```

**404 Not Found - Gift Not Found:**
```json
{
  "statusCode": 404,
  "message": "Gift not found"
}
```

### Android Implementation

#### 1. API Service Interface
```kotlin
interface ParentApiService {
    @DELETE("parents/{parentId}/kids/{kidId}/gifts/{giftId}")
    suspend fun deleteGift(
        @Path("parentId") parentId: String,
        @Path("kidId") kidId: String,
        @Path("giftId") giftId: String
    ): MessageResponse
}

data class MessageResponse(
    val message: String
)
```

#### 2. Repository
```kotlin
class GiftRepository(private val apiService: ParentApiService) {
    
    suspend fun deleteGift(
        parentId: String,
        kidId: String,
        giftId: String
    ): Result<String> {
        return try {
            val response = apiService.deleteGift(parentId, kidId, giftId)
            Result.success(response.message)
        } catch (e: HttpException) {
            when (e.code()) {
                404 -> Result.failure(Exception("Gift not found"))
                else -> Result.failure(Exception("Failed to delete gift"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

#### 3. ViewModel
```kotlin
class ParentGiftViewModel(
    private val repository: GiftRepository
) : ViewModel() {
    
    private val _deleteGiftState = MutableStateFlow<UiState<String>>(UiState.Idle)
    val deleteGiftState: StateFlow<UiState<String>> = _deleteGiftState
    
    fun deleteGift(parentId: String, kidId: String, giftId: String) {
        viewModelScope.launch {
            _deleteGiftState.value = UiState.Loading
            
            val result = repository.deleteGift(parentId, kidId, giftId)
            
            _deleteGiftState.value = if (result.isSuccess) {
                UiState.Success(result.getOrNull()!!)
            } else {
                UiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }
}
```

#### 4. UI (Jetpack Compose)
```kotlin
@Composable
fun GiftManagementScreen(
    parentId: String,
    kidId: String,
    gifts: List<Gift>,
    viewModel: ParentGiftViewModel
) {
    var showDeleteDialog by remember { mutableStateOf<Gift?>(null) }
    val deleteGiftState by viewModel.deleteGiftState.collectAsState()
    
    LaunchedEffect(deleteGiftState) {
        if (deleteGiftState is UiState.Success) {
            // Refresh gift list
            // Show success message
        }
    }
    
    LazyColumn {
        items(gifts) { gift ->
            GiftManagementCard(
                gift = gift,
                onDeleteClick = { showDeleteDialog = gift }
            )
        }
    }
    
    // Delete Confirmation Dialog
    showDeleteDialog?.let { gift ->
        AlertDialog(
            onDismissRequest = { showDeleteDialog = null },
            title = { Text("Delete Gift?") },
            text = { Text("Are you sure you want to delete '${gift.title}'?") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteGift(parentId, kidId, gift._id)
                        showDeleteDialog = null
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun GiftManagementCard(gift: Gift, onDeleteClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = gift.title,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "${gift.cost} points",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            IconButton(onClick = onDeleteClick) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete gift",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}
```

---

## 3️⃣ BUY GIFT (Child)

### Endpoint
```http
POST /parents/{parentId}/kids/{kidId}/gifts/{giftId}/buy
```

### Description
Allows a child to purchase a gift from their catalog using their earned points. The cost is deducted from the child's `Score` (spendable points), and the gift is added to their inventory.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `parentId` | String | The ID of the parent |
| `kidId` | String | The ID of the child |
| `giftId` | String | The ID of the gift to purchase |

### Request Body
None (this is a POST request with no body)

### Success Response (200 OK)
```json
{
  "message": "Gift purchased successfully",
  "remainingScore": 450,
  "gift": {
    "_id": "674a5b2c8f1e4d3a2b1c9d8e",
    "title": "Lego Star Wars Set",
    "cost": 50
  }
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `message` | String | Success message |
| `remainingScore` | Number | Child's remaining spendable points after purchase |
| `gift` | Object | The purchased gift details |

### Error Responses

**400 Bad Request - Insufficient Points:**
```json
{
  "statusCode": 400,
  "message": "Not enough points to buy this gift"
}
```

**404 Not Found - Parent Not Found:**
```json
{
  "statusCode": 404,
  "message": "Parent not found"
}
```

**404 Not Found - Child Not Found:**
```json
{
  "statusCode": 404,
  "message": "Child not found"
}
```

**404 Not Found - Gift Not Found:**
```json
{
  "statusCode": 404,
  "message": "Gift not found in catalog"
}
```

### Android Implementation

#### 1. API Service Interface
```kotlin
interface ParentApiService {
    @POST("parents/{parentId}/kids/{kidId}/gifts/{giftId}/buy")
    suspend fun buyGift(
        @Path("parentId") parentId: String,
        @Path("kidId") kidId: String,
        @Path("giftId") giftId: String
    ): BuyGiftResponse
}

data class BuyGiftResponse(
    val message: String,
    val remainingScore: Int,
    val gift: Gift
)
```

#### 2. Repository
```kotlin
class GiftRepository(private val apiService: ParentApiService) {
    
    suspend fun buyGift(
        parentId: String,
        kidId: String,
        giftId: String
    ): Result<BuyGiftResponse> {
        return try {
            val response = apiService.buyGift(parentId, kidId, giftId)
            Result.success(response)
        } catch (e: HttpException) {
            when (e.code()) {
                400 -> Result.failure(InsufficientPointsException("Not enough points"))
                404 -> Result.failure(Exception("Gift not found"))
                else -> Result.failure(Exception("Failed to purchase gift"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class InsufficientPointsException(message: String) : Exception(message)
```

#### 3. ViewModel
```kotlin
class ChildGiftViewModel(
    private val repository: GiftRepository
) : ViewModel() {
    
    private val _buyGiftState = MutableStateFlow<UiState<BuyGiftResponse>>(UiState.Idle)
    val buyGiftState: StateFlow<UiState<BuyGiftResponse>> = _buyGiftState
    
    private val _childScore = MutableStateFlow(0)
    val childScore: StateFlow<Int> = _childScore
    
    fun buyGift(parentId: String, kidId: String, giftId: String) {
        viewModelScope.launch {
            _buyGiftState.value = UiState.Loading
            
            val result = repository.buyGift(parentId, kidId, giftId)
            
            _buyGiftState.value = if (result.isSuccess) {
                val response = result.getOrNull()!!
                _childScore.value = response.remainingScore
                UiState.Success(response)
            } else {
                val exception = result.exceptionOrNull()
                val message = when (exception) {
                    is InsufficientPointsException -> "Not enough points to buy this gift"
                    else -> exception?.message ?: "Unknown error"
                }
                UiState.Error(message)
            }
        }
    }
    
    fun resetBuyState() {
        _buyGiftState.value = UiState.Idle
    }
}
```

#### 4. UI (Jetpack Compose)
```kotlin
@Composable
fun GiftShopScreen(
    parentId: String,
    kidId: String,
    gifts: List<Gift>,
    currentScore: Int,
    viewModel: ChildGiftViewModel
) {
    var showPurchaseDialog by remember { mutableStateOf<Gift?>(null) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var purchasedGift by remember { mutableStateOf<Gift?>(null) }
    
    val buyGiftState by viewModel.buyGiftState.collectAsState()
    
    LaunchedEffect(buyGiftState) {
        when (val state = buyGiftState) {
            is UiState.Success -> {
                purchasedGift = state.data.gift
                showSuccessDialog = true
                showPurchaseDialog = null
                viewModel.resetBuyState()
            }
            is UiState.Error -> {
                // Error is shown in the dialog
            }
            else -> {}
        }
    }
    
    Column(modifier = Modifier.fillMaxSize()) {
        // Header with points
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🎁 Gift Shop",
                    style = MaterialTheme.typography.headlineSmall
                )
                Text(
                    text = "💰 $currentScore points",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
        
        // Gift list
        LazyColumn {
            items(gifts) { gift ->
                GiftShopCard(
                    gift = gift,
                    currentScore = currentScore,
                    onBuyClick = { showPurchaseDialog = gift }
                )
            }
        }
    }
    
    // Purchase Confirmation Dialog
    showPurchaseDialog?.let { gift ->
        PurchaseConfirmationDialog(
            gift = gift,
            currentScore = currentScore,
            buyGiftState = buyGiftState,
            onConfirm = {
                viewModel.buyGift(parentId, kidId, gift._id)
            },
            onDismiss = {
                showPurchaseDialog = null
                viewModel.resetBuyState()
            }
        )
    }
    
    // Success Dialog
    if (showSuccessDialog && purchasedGift != null) {
        PurchaseSuccessDialog(
            gift = purchasedGift!!,
            onDismiss = {
                showSuccessDialog = false
                purchasedGift = null
            }
        )
    }
}

@Composable
fun GiftShopCard(
    gift: Gift,
    currentScore: Int,
    onBuyClick: () -> Unit
) {
    val canAfford = currentScore >= gift.cost
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = gift.title,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "${gift.cost} points",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (canAfford) 
                        MaterialTheme.colorScheme.primary 
                    else 
                        MaterialTheme.colorScheme.error
                )
            }
            
            Button(
                onClick = onBuyClick,
                enabled = canAfford,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (canAfford) 
                        MaterialTheme.colorScheme.primary 
                    else 
                        MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Text(if (canAfford) "Buy Now" else "Not Enough")
            }
        }
    }
}

@Composable
fun PurchaseConfirmationDialog(
    gift: Gift,
    currentScore: Int,
    buyGiftState: UiState<BuyGiftResponse>,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Purchase Gift?") },
        text = {
            Column {
                Text("Do you want to buy '${gift.title}' for ${gift.cost} points?")
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Current balance: $currentScore points",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "After purchase: ${currentScore - gift.cost} points",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
                
                if (buyGiftState is UiState.Error) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = buyGiftState.message,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = buyGiftState !is UiState.Loading
            ) {
                if (buyGiftState is UiState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Buy")
                }
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = buyGiftState !is UiState.Loading
            ) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun PurchaseSuccessDialog(
    gift: Gift,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(48.dp)
            )
        },
        title = { Text("Purchase Successful! 🎉") },
        text = {
            Text("You've successfully purchased '${gift.title}'! Check your inventory to see it.")
        },
        confirmButton = {
            Button(onClick = onDismiss) {
                Text("Awesome!")
            }
        }
    )
}
```

---

## 🎨 Complete User Flow Example

### Scenario: Child Buying a Gift

1. **Child opens Gift Shop**
   - Sees their current points: 500
   - Sees available gifts in their catalog

2. **Child selects a gift**
   - Taps "Buy Now" on "Lego Set" (cost: 300 points)
   - Confirmation dialog appears

3. **Child confirms purchase**
   - Dialog shows:
     - Current balance: 500 points
     - After purchase: 200 points
   - Child taps "Buy"

4. **API Request**
   ```http
   POST /parents/parent123/kids/kid456/gifts/gift789/buy
   ```

5. **Success Response**
   ```json
   {
     "message": "Gift purchased successfully",
     "remainingScore": 200,
     "gift": {
       "_id": "gift789",
       "title": "Lego Set",
       "cost": 300
     }
   }
   ```

6. **UI Updates**
   - Success dialog with confetti animation
   - Points updated: 500 → 200
   - Gift removed from shop (or marked as purchased)
   - Gift added to inventory

---

## 🔒 Error Handling Best Practices

### 1. Network Errors
```kotlin
try {
    val response = apiService.buyGift(parentId, kidId, giftId)
    // Success
} catch (e: IOException) {
    // No internet connection
    showError("Please check your internet connection")
} catch (e: HttpException) {
    // HTTP error
    when (e.code()) {
        400 -> showError("Not enough points")
        404 -> showError("Gift not found")
        500 -> showError("Server error, please try again")
        else -> showError("Something went wrong")
    }
}
```

### 2. Validation Before API Call
```kotlin
fun buyGift(gift: Gift, currentScore: Int) {
    // Client-side validation
    if (currentScore < gift.cost) {
        showError("You don't have enough points")
        return
    }
    
    // Proceed with API call
    viewModelScope.launch {
        repository.buyGift(parentId, kidId, gift._id)
    }
}
```

### 3. Loading States
```kotlin
when (buyGiftState) {
    is UiState.Idle -> { /* Show normal UI */ }
    is UiState.Loading -> { /* Show loading spinner */ }
    is UiState.Success -> { /* Show success message */ }
    is UiState.Error -> { /* Show error message */ }
}
```

---

## 📊 Testing Checklist

### Create Gift
- [ ] Successfully create gift with valid data
- [ ] Handle invalid parent ID
- [ ] Handle invalid child ID
- [ ] Handle network errors
- [ ] Validate input fields (title not empty, cost > 0)

### Delete Gift
- [ ] Successfully delete existing gift
- [ ] Handle invalid gift ID
- [ ] Show confirmation dialog before deletion
- [ ] Refresh gift list after deletion
- [ ] Handle network errors

### Buy Gift
- [ ] Successfully buy gift with sufficient points
- [ ] Show error when insufficient points
- [ ] Update UI with new point balance
- [ ] Add gift to inventory
- [ ] Show success animation/message
- [ ] Handle network errors
- [ ] Prevent double-purchase (disable button during loading)

---

## 🎯 Summary

These three endpoints form the core of the gift system:

1. **CREATE GIFT** - Parents add personalized rewards for their children
2. **DELETE GIFT** - Parents manage and remove gifts from the catalog
3. **BUY GIFT** - Children redeem their earned points for rewards

Each endpoint includes proper error handling, validation, and user feedback to create a smooth, engaging experience!
