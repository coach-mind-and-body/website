import SwiftUI

struct MealPlanView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore

    private let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    var body: some View {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if let plan = food.mealPlan {
                        Text(plan.title).font(.headline).foregroundStyle(HTTheme.forest)
                        if let d = plan.description { Text(d).font(.subheadline).foregroundStyle(HTTheme.muted) }
                        if auth.isSignedIn {
                            Button("Build shopping list") { Task { await food.buildShop() } }
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(HTTheme.gold)
                        }
                        ForEach(0..<7, id: \.self) { day in
                            let slots = (plan.slots ?? []).filter { $0.dayOfWeek == day }
                            if !slots.isEmpty {
                                Text(days[day])
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(day == MountainDate.weekdayIndex(MountainDate.today()) ? HTTheme.gold : HTTheme.muted)
                                ForEach(Array(slots.enumerated()), id: \.offset) { _, slot in
                                    if let rec = slot.recipe {
                                        NavigationLink(value: rec.slug) {
                                            HStack {
                                                Text(slot.slot.capitalized).font(.caption.weight(.bold)).foregroundStyle(HTTheme.gold)
                                                Text(rec.title).foregroundStyle(HTTheme.forest)
                                                Spacer()
                                            }
                                            .padding(12)
                                            .background(Color.white)
                                            .clipShape(RoundedRectangle(cornerRadius: 14))
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                        }
                    } else {
                        Text("Lee Anne hasn’t assigned a week yet — browse the vault.")
                            .foregroundStyle(HTTheme.muted)
                    }
                }
                .padding(16)
            }
            .dockScrollClearance()
            .background(HTTheme.cream)
            .task(id: food.sessionEpoch) { await food.loadPlan() }
            .refreshable { await food.loadPlan() }
    }
}

struct ShopView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore
    @State private var newItem = ""

    var body: some View {
        VStack(spacing: 0) {
            if auth.isSignedIn {
                HStack(spacing: 8) {
                    TextField("Add something…", text: $newItem)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { addTapped() }
                    Button("Add") { addTapped() }
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(HTTheme.forest)
                        .disabled(newItem.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 8)

                if food.shop.contains(where: \.isChecked) {
                    Button("Clear checked") {
                        Task { await food.clearCheckedShop() }
                    }
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.gold)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 6)
                }
            }

            List {
                if !auth.isSignedIn {
                    Text("Sign in under You to keep a shopping list.")
                        .foregroundStyle(HTTheme.muted)
                        .listRowBackground(Color.clear)
                } else if food.shop.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("The list is empty.")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        Text("Type an item above. Or open Week and tap Build shopping list.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.muted)
                    }
                    .listRowBackground(Color.clear)
                } else {
                    ForEach(food.shop) { item in
                        Button {
                            Task { await food.toggleShop(item) }
                        } label: {
                            HStack {
                                Image(systemName: item.isChecked ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(item.isChecked ? HTTheme.gold : HTTheme.muted)
                                VStack(alignment: .leading) {
                                    Text(item.name)
                                        .strikethrough(item.isChecked)
                                        .foregroundStyle(HTTheme.forest)
                                    if let amt = item.amount {
                                        Text("\(amt) \(item.unit ?? "")").font(.caption).foregroundStyle(HTTheme.muted)
                                    }
                                }
                            }
                        }
                    }
                    .onDelete { offsets in
                        let items = offsets.map { food.shop[$0] }
                        Task {
                            for item in items { await food.removeShopItem(item) }
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
        }
        .dockScrollClearance()
        .background(HTTheme.cream)
        .task(id: food.sessionEpoch) { await food.loadShop() }
        .refreshable { await food.loadShop() }
    }

    private func addTapped() {
        let name = newItem.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        newItem = ""
        Task { await food.addShopItem(name) }
    }
}


