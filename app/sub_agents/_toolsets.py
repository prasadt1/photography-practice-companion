"""Assemble FunctionTool lists per sub-agent (§7)."""

from __future__ import annotations

from google.adk.tools import AgentTool, FunctionTool

from sub_agents.tools import coach_tools, field_coach_tools, mentor_tools, planner_tools
from sub_agents.tools import print_sales_tools, reflection_tools, triage_tools, visual_describer_tools


def coach_tool_list() -> list:
    return [
        FunctionTool(coach_tools.analyze_image_multimodal),
        FunctionTool(coach_tools.ground_in_data_store_principles),
        FunctionTool(coach_tools.generate_multimodal_embedding),
        FunctionTool(coach_tools.write_portfolio_entry_note),
    ]


def mentor_tool_list() -> list:
    return [
        FunctionTool(mentor_tools.atlas_search_glass_box),
        FunctionTool(mentor_tools.vector_search_similar_photos),
        FunctionTool(mentor_tools.get_recent_portfolio_aggregates_by_time),
        FunctionTool(mentor_tools.get_aesthetic_profile_summary_tool),
        FunctionTool(mentor_tools.ground_in_data_store_principles),
    ]


def planner_tool_list() -> list:
    return [
        FunctionTool(planner_tools.get_portfolio_aggregates_by_skill),
        FunctionTool(planner_tools.get_active_assignment),
        FunctionTool(planner_tools.write_practice_assignment),
        FunctionTool(planner_tools.query_data_store_principles_for_assignment),
        FunctionTool(planner_tools.query_client_outcomes),
    ]


def reflection_tool_list() -> list:
    return [
        FunctionTool(reflection_tools.get_shoot_photos_with_scores),
        FunctionTool(reflection_tools.compare_multimodal_embeddings),
        FunctionTool(reflection_tools.write_skill_delta_to_assignment),
        FunctionTool(reflection_tools.get_aesthetic_profile_summary_tool),
        FunctionTool(planner_tools.get_active_assignment),
    ]


def triage_tool_list() -> list:
    return [
        FunctionTool(triage_tools.cluster_portfolio_by_embedding),
        FunctionTool(triage_tools.propose_bulk_tag_application),
        FunctionTool(triage_tools.find_duplicate_portfolio_entries),
        FunctionTool(triage_tools.surface_top_scoring_untouched_photos),
        FunctionTool(triage_tools.propose_photo_deletion),
    ]


def print_sales_tool_list() -> list:
    return [
        FunctionTool(print_sales_tools.get_print_sales_history),
        FunctionTool(print_sales_tools.vector_search_similar_to_top_sellers),
        FunctionTool(print_sales_tools.aggregate_roi_by_marketplace),
        FunctionTool(print_sales_tools.generate_listing_metadata),
        FunctionTool(print_sales_tools.propose_listing_publication),
        FunctionTool(print_sales_tools.get_aesthetic_profile_summary_tool),
    ]


def visual_describer_tool_list() -> list:
    return [
        FunctionTool(visual_describer_tools.analyze_frame_for_description),
        FunctionTool(visual_describer_tools.compute_spatial_position),
        FunctionTool(visual_describer_tools.trigger_haptic_pattern),
        FunctionTool(visual_describer_tools.narrate_capture_session),
        FunctionTool(visual_describer_tools.atlas_search_scene_descriptions),
        FunctionTool(visual_describer_tools.write_capture_session_event),
    ]


def field_coach_tool_list(persona: str = "hobbyist") -> list:
    from sub_agents.coach import coach_agent
    from sub_agents.mentor import mentor_agent
    from sub_agents.visual_describer import visual_describer_agent

    tools: list = [
        FunctionTool(field_coach_tools.get_session_state),
        FunctionTool(field_coach_tools.update_session_state),
        FunctionTool(field_coach_tools.start_capture_session),
        AgentTool(agent=coach_agent),
        AgentTool(agent=mentor_agent),
    ]
    if persona == "vision_impairment":
        tools.append(AgentTool(agent=visual_describer_agent))
    return tools
